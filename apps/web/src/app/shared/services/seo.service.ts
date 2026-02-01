import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  robots?: string; // e.g., 'index, follow' or 'noindex, nofollow'
  canonical?: string; // Override canonical URL if different from url
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  private readonly DEFAULT_CONFIG: SEOConfig = {
    title: 'RinkLink.ai - AI-Powered Youth Hockey Scheduling & Tournament Management',
    description:
      'Streamline youth hockey team scheduling with RinkLink.ai. AI-powered game matching, schedule risk monitoring, tournament fit analysis, and an AI assistant that handles outreach — so you can focus on the game.',
    keywords:
      'youth hockey, hockey scheduling, tournament management, ice hockey, team scheduling, opponent matching, game matching, schedule risk monitor, tournament fit evaluator, AI scheduling assistant, RinkLinkGPT, hockey tournaments, ice time scheduling, sports management, AI scheduling, bulk ice import',
    image: 'https://rinklink.ai/summary.png',
    url: 'https://rinklink.ai',
    type: 'website',
    author: 'RinkLink.ai',
    twitterCard: 'summary_large_image',
  };

  /**
   * Updates all SEO-related meta tags for a page
   * @param config Partial SEO configuration that will be merged with defaults
   */
  updateTags(config: SEOConfig = {}): void {
    const seoConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Update title
    if (seoConfig.title) {
      this.titleService.setTitle(seoConfig.title);
    }

    // Update or add standard meta tags
    if (seoConfig.description) {
      this.metaService.updateTag({
        name: 'description',
        content: seoConfig.description,
      });
    }

    if (seoConfig.keywords) {
      this.metaService.updateTag({
        name: 'keywords',
        content: seoConfig.keywords,
      });
    }

    if (seoConfig.author) {
      this.metaService.updateTag({ name: 'author', content: seoConfig.author });
    }

    // Update robots meta tag
    if (seoConfig.robots) {
      this.metaService.updateTag({ name: 'robots', content: seoConfig.robots });
    }

    // Update Open Graph meta tags
    this.updateOpenGraphTags(seoConfig);

    // Update Twitter Card meta tags
    this.updateTwitterCardTags(seoConfig);

    // Update canonical URL
    const canonicalUrl = seoConfig.canonical || seoConfig.url;
    if (canonicalUrl) {
      this.updateCanonicalUrl(canonicalUrl);
    }
  }

  /**
   * Updates Open Graph meta tags for social sharing
   */
  private updateOpenGraphTags(config: SEOConfig): void {
    const tags: { property: string; content: string }[] = [
      { property: 'og:title', content: config.title },
      { property: 'og:description', content: config.description },
      { property: 'og:image', content: config.image },
      { property: 'og:url', content: config.url },
      { property: 'og:type', content: config.type },
      { property: 'og:site_name', content: 'RinkLink.ai' },
    ].filter((tag): tag is { property: string; content: string } => !!tag.content);

    tags.forEach((tag) => {
      this.metaService.updateTag(tag);
    });
  }

  /**
   * Updates Twitter Card meta tags for Twitter sharing
   */
  private updateTwitterCardTags(config: SEOConfig): void {
    const tags: { name: string; content: string }[] = [
      { name: 'twitter:card', content: config.twitterCard },
      { name: 'twitter:title', content: config.title },
      { name: 'twitter:description', content: config.description },
      { name: 'twitter:image', content: config.image },
    ].filter((tag): tag is { name: string; content: string } => !!tag.content);

    tags.forEach((tag) => {
      this.metaService.updateTag(tag);
    });
  }

  /**
   * Updates or creates canonical link tag
   */
  private updateCanonicalUrl(url: string): void {
    // Remove existing canonical links
    const existingLinks = document.querySelectorAll('link[rel="canonical"]');
    existingLinks.forEach((link) => link.remove());

    // Add new canonical link
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }

  /**
   * Adds JSON-LD structured data to the page
   * @param data The structured data object
   */
  addStructuredData(data: Record<string, unknown>): void {
    // Remove existing script if present
    const existingScript = document.querySelector(
      'script[type="application/ld+json"]'
    );
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Adds multiple JSON-LD structured data objects
   */
  addMultipleStructuredData(dataArray: Record<string, unknown>[]): void {
    // Remove existing scripts
    const existingScripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    existingScripts.forEach((script) => script.remove());

    // Add each structured data object
    dataArray.forEach((data) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
    });
  }

  /**
   * Generates Organization structured data
   */
  getOrganizationSchema(): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'RinkLink.ai',
      url: 'https://rinklink.ai',
      logo: 'https://rinklink.ai/favicon.ico',
      description:
        'AI-powered youth hockey scheduling and tournament management platform',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        url: 'https://rinklink.ai/contact',
      },
      sameAs: [
        // Add social media URLs when available
      ],
    };
  }

  /**
   * Generates WebSite structured data
   */
  getWebSiteSchema(): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'RinkLink.ai',
      url: 'https://rinklink.ai',
      description:
        'AI-powered youth hockey scheduling and tournament management platform',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://rinklink.ai/tournaments?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    };
  }

  /**
   * Generates SoftwareApplication structured data
   */
  getSoftwareApplicationSchema(): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'RinkLink.ai',
      applicationCategory: 'SportsApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'Offer',
        price: '75',
        priceCurrency: 'USD',
        billingDuration: 'P1Y',
        description: 'Per seat per year',
      },
      description:
        'AI-powered youth hockey scheduling and tournament management platform. Features game matching by skill and distance, schedule risk monitoring, tournament fit analysis, and RinkLinkGPT — an AI assistant that drafts outreach, negotiates game times, and manages your calendar.',
    };
  }

  /**
   * Generates BreadcrumbList structured data
   * @param breadcrumbs Array of breadcrumb items with name and url
   */
  getBreadcrumbListSchema(
    breadcrumbs: Array<{ name: string; url: string }>,
  ): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }

  /**
   * Generates FAQPage structured data
   * @param faqs Array of FAQ items with question and answer
   */
  getFAQPageSchema(
    faqs: Array<{ question: string; answer: string }>,
  ): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * Generates ItemList structured data for tournament listings
   * @param items Array of items with name, url, and optional description
   */
  getItemListSchema(
    items: Array<{ name: string; url: string; description?: string }>,
    listName?: string,
  ): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: listName || 'List',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
        description: item.description,
      })),
    };
  }

  /**
   * Generates Event structured data for tournaments
   * @param eventData Tournament event data
   */
  getSportsEventSchema(eventData: {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    location: string;
    url?: string;
    image?: string;
  }): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: eventData.name,
      description: eventData.description,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      location: {
        '@type': 'Place',
        name: eventData.location,
      },
      url: eventData.url,
      image: eventData.image,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
    };
  }
}
