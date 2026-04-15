import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const { url, userId } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let targetUrl = url;
    if (!url.startsWith('http')) {
      targetUrl = `https://${url}`;
    }

    try {
      new URL(targetUrl);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format. Please provide a valid website address.' }, { status: 400 });
    }

    let response;
    try {
      response = await axios.get(targetUrl, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        },
        validateStatus: (status) => status < 500, // Allow 4xx to see if we can still get some HTML
      });
    } catch (axiosError: any) {
      console.error('Axios error:', axiosError.message);
      return NextResponse.json({ 
        error: axiosError.code === 'ECONNABORTED' 
          ? 'Analysis timed out. The website took too long to respond.' 
          : `Could not reach the website: ${axiosError.message}` 
      }, { status: 500 });
    }

    const html = response.data;
    if (typeof html !== 'string') {
      return NextResponse.json({ error: 'The website returned an invalid response format.' }, { status: 500 });
    }
    const $ = cheerio.load(html);
    const domain = new URL(targetUrl).hostname;

    // Multi-page crawling (Basic)
    const internalLinks = new Set<string>();
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      try {
        const linkUrl = new URL(href, targetUrl);
        if (linkUrl.hostname === domain && !linkUrl.pathname.match(/\.(pdf|jpg|jpeg|png|gif|svg|zip|gz)$/i)) {
          // Normalize URL
          linkUrl.hash = '';
          internalLinks.add(linkUrl.toString());
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    });

    const pagesToCrawl = Array.from(internalLinks).slice(0, 4); // Crawl up to 4 more pages + home = 5 total
    const crawledPages = [targetUrl];
    
    // For now, we just count them and maybe check if they are reachable
    // In a real app, we'd aggregate SEO data from all of them
    const crawlResults = await Promise.allSettled(pagesToCrawl.map(url => 
      axios.get(url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } })
    ));

    crawlResults.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        crawledPages.push(pagesToCrawl[index]);
      }
    });

    const pagesCrawledCount = crawledPages.length;

    // Extraction (from home page)
    const title = $('title').text() || '';
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').first().text() || '';
    const h2s: string[] = [];
    $('h2').each((_, el) => {
      h2s.push($(el).text());
    });

    const images = $('img');
    let imagesWithAlt = 0;
    images.each((_, el) => {
      if ($(el).attr('alt')) imagesWithAlt++;
    });

    const links = $('a').length;
    const wordCount = $('body').text().split(/\s+/).length;

    // New checks
    const canonical = $('link[rel="canonical"]').attr('href');
    const robots = $('meta[name="robots"]').attr('content');
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDescription = $('meta[property="og:description"]').attr('content');
    const twitterCard = $('meta[name="twitter:card"]').attr('content');
    const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');
    const viewport = $('meta[name="viewport"]').attr('content');
    const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content');
    const lang = $('html').attr('lang');
    const hasSchema = $('script[type="application/ld+json"]').length > 0;

    // Scoring
    let score = 0;
    const issues = [];

    // 1. Title Tag (20 points)
    if (title) {
      score += 10; // Presence
      if (title.length >= 50 && title.length <= 70) {
        score += 10; // Optimal length
      } else {
        issues.push({ 
          type: 'Title Length', 
          severity: 'medium', 
          message: `Title length is ${title.length} chars. Optimal is 50-70.` 
        });
      }
    } else {
      issues.push({ type: 'Title', severity: 'high', message: 'Missing page title' });
    }

    // 2. Meta Description (15 points)
    if (metaDescription) {
      score += 5; // Presence
      if (metaDescription.length >= 120 && metaDescription.length <= 160) {
        score += 10; // Optimal length
      } else {
        issues.push({ 
          type: 'Meta Description Length', 
          severity: 'medium', 
          message: `Meta description is ${metaDescription.length} chars. Optimal is 120-160.` 
        });
      }
    } else {
      issues.push({ type: 'Meta Description', severity: 'high', message: 'Missing meta description' });
    }

    // 3. H1 Heading (10 points)
    const h1Count = $('h1').length;
    if (h1Count > 0) {
      score += 5; // Presence
      if (h1Count === 1) {
        score += 5; // Best practice: exactly one H1
      } else {
        issues.push({ 
          type: 'H1 Count', 
          severity: 'medium', 
          message: `Found ${h1Count} H1 tags. Should have exactly one.` 
        });
      }
    } else {
      issues.push({ type: 'H1', severity: 'medium', message: 'Missing H1 heading' });
    }

    // 4. Image Alt Text (10 points)
    if (images.length > 0) {
      const altCoverage = (imagesWithAlt / images.length);
      score += Math.round(altCoverage * 10);
      if (imagesWithAlt < images.length) {
        issues.push({ 
          type: 'Alt Text', 
          severity: 'medium', 
          message: `${images.length - imagesWithAlt} images are missing alt text` 
        });
      }
    } else {
      score += 10;
    }

    // 5. Content Depth (10 points)
    if (wordCount > 600) {
      score += 10;
    } else if (wordCount > 300) {
      score += 5;
      issues.push({ type: 'Content', severity: 'low', message: 'Thin content (under 600 words)' });
    } else {
      issues.push({ type: 'Content', severity: 'medium', message: 'Very thin content (under 300 words)' });
    }

    // 6. Technical SEO (20 points)
    if (canonical) score += 4; else issues.push({ type: 'Canonical', severity: 'medium', message: 'Missing canonical tag' });
    if (robots) score += 4; else issues.push({ type: 'Robots', severity: 'low', message: 'Missing robots meta tag' });
    if (viewport) score += 4; else issues.push({ type: 'Viewport', severity: 'medium', message: 'Missing viewport meta tag' });
    if (charset) score += 4; else issues.push({ type: 'Charset', severity: 'medium', message: 'Missing charset meta tag' });
    if (lang) score += 4; else issues.push({ type: 'Language', severity: 'low', message: 'Missing HTML lang attribute' });

    // 7. Social & Structured Data (15 points)
    if (ogTitle || ogDescription) score += 5; else issues.push({ type: 'Open Graph', severity: 'low', message: 'Missing Open Graph tags' });
    if (twitterCard) score += 5; else issues.push({ type: 'Twitter Card', severity: 'low', message: 'Missing Twitter Card tags' });
    if (hasSchema) score += 5; else issues.push({ type: 'Structured Data', severity: 'low', message: 'Missing Schema.org structured data' });

    const result = {
      domain: new URL(targetUrl).hostname,
      seo_score: score,
      issues: issues,
      metadata: {
        title,
        metaDescription,
        h1,
        h2Count: h2s.length,
        imageCount: images.length,
        linkCount: links,
        wordCount
      }
    };

    // Generate suggestions based on results
    const suggestions = [];
    if (!title) {
      suggestions.push({
        title: 'Add Missing Title Tag',
        description: 'Your page is missing a title tag. Adding one is crucial for SEO and CTR.',
        priority: 'high',
        impact_score: '+15.0 Score',
        category: 'Technical'
      });
    } else if (title.length < 50 || title.length > 70) {
      suggestions.push({
        title: 'Optimize Title Length',
        description: 'Your title tag should be between 50-70 characters for optimal display in search results.',
        priority: 'medium',
        impact_score: '+5.0 Score',
        category: 'Technical'
      });
    }

    if (!metaDescription) {
      suggestions.push({
        title: 'Add Missing Meta Description',
        description: 'Meta descriptions help improve click-through rates from search results.',
        priority: 'high',
        impact_score: '+10.0 Score',
        category: 'Content'
      });
    }

    if (images.length > imagesWithAlt) {
      suggestions.push({
        title: 'Optimize Images Alt Text',
        description: `${images.length - imagesWithAlt} images are missing alt text. Add descriptive alt text to improve accessibility.`,
        priority: 'medium',
        impact_score: '+2.8 Score',
        category: 'Technical'
      });
    }

    if (wordCount < 300) {
      suggestions.push({
        title: 'Increase Content Depth',
        description: 'Your page has very thin content. Aim for at least 600 words for better rankings.',
        priority: 'medium',
        impact_score: '+10.0 Score',
        category: 'Content'
      });
    }

    // Store in Supabase if userId is provided
    if (userId) {
      try {
        // 1. Get or create project
        let { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', userId)
          .eq('url', result.domain)
          .maybeSingle();

        if (projectError && projectError.code !== 'PGRST116') {
          console.error('Project fetch error:', projectError);
        }

        if (!project) {
          const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert([{ 
              user_id: userId, 
              name: result.domain,
              url: result.domain 
            }])
            .select()
            .single();
          
          if (createError) {
            console.error('Project creation error:', createError);
          } else {
            project = newProject;
          }
        }

        // 2. Create analysis
        if (project) {
          try {
            const { data: analysis, error: analysisError } = await supabase
              .from('analyses')
              .insert([{
                project_id: project.id,
                score: result.seo_score,
                total_errors: result.issues.filter(i => i.severity === 'high').length,
                total_warnings: result.issues.filter(i => i.severity === 'medium').length,
                good_points: result.issues.filter(i => i.severity === 'low').length,
                pages_crawled: pagesCrawledCount,
                full_report_json: {
                  ...result,
                  suggestions: suggestions // Include suggestions in the full report
                }
              }])
              .select()
              .single();

            if (analysisError) {
              console.warn('Analysis storage failed:', analysisError.message);
            } else if (analysis) {
              // 3. Update project last_analyzed_at
              await supabase
                .from('projects')
                .update({ last_analyzed_at: new Date().toISOString() })
                .eq('id', project.id);

              // 4. Create suggestions
              const suggestionsToInsert = suggestions.map(s => ({
                analysis_id: analysis.id,
                type: s.category.toLowerCase(),
                title: s.title,
                description: s.description,
                impact_score: s.impact_score,
                status: 'open'
              }));

              if (suggestionsToInsert.length > 0) {
                await supabase.from('suggestions').insert(suggestionsToInsert);
              }
            }
          } catch (storageErr) {
            console.warn('Optional storage failed:', storageErr);
          }
        }
      } catch (supabaseErr) {
        console.error('Supabase integration error:', supabaseErr);
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    };
    console.error('Analysis error details:', errorDetails);
    return NextResponse.json({ 
      error: error.message || 'Failed to analyze website. Please check the URL and try again.' 
    }, { status: 500 });
  }
}
