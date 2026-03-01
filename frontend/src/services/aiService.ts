import { Company, Listing, CompanyRequest } from '../types';

interface RecommendationRequest {
  company: Company;
  requests: CompanyRequest[];
  allListings: Listing[];
}

interface AIRecommendationResponse {
  topListings: Listing[];
  explanations: Record<string, string>;
}

class AIService {
  private apiKey: string;
  private apiBaseUrl: string = 'https://openrouter.ai/api/v1';
  private model: string = 'google/gemini-2.0-flash-001';

  constructor() {
    this.apiKey = process.env.REACT_APP_OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key not configured in .env file');
    }
  }

  async getRecommendedListings(
    company: Company,
    requests: CompanyRequest[],
    allListings: Listing[]
  ): Promise<AIRecommendationResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      // Prepare the prompt for Gemini
      const prompt = this.buildRecommendationPrompt(company, requests, allListings);

      console.log('🤖 Calling OpenRouter API with Gemini model...');

      const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ConsulTech Network',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ OpenRouter API error:', error);
        throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Got response from Gemini');

      // Parse the AI response
      const aiContent = data.choices[0].message.content;
      return this.parseAIResponse(aiContent, allListings);
    } catch (error) {
      console.error('❌ Error getting AI recommendations:', error);
      throw error;
    }
  }

  private buildRecommendationPrompt(
    company: Company,
    requests: CompanyRequest[],
    allListings: Listing[]
  ): string {
    const requestsText = requests.length > 0
      ? requests.map(r => `- ${r.title} (${r.category}): ${r.description}`).join('\n')
      : 'No specific requests';

    const listingsText = allListings
      .map(l => `ID: ${l.id} | Title: "${l.title}" | Category: ${l.category} | Company: ${l.company_name} | Description: ${l.description}`)
      .join('\n');

    return `You are a business matchmaking AI for the ConsulTech Network, a circular economy community. 
Your task is to recommend the TOP 3 most relevant listings for a company based on their profile and needs.

COMPANY PROFILE:
- Name: ${company.company_name}
- Industry: ${company.industry}
- Size: ${company.size}
- Description: ${company.description}

COMPANY'S REQUESTS (What they're looking for):
${requestsText}

AVAILABLE LISTINGS:
${listingsText}

TASK:
1. Analyze the company's industry (${company.industry}), size (${company.size}), and their stated requests
2. Identify the TOP 3 listings that best match their needs
3. Return ONLY a JSON object (no markdown formatting, no backticks) with this exact structure:
{
  "recommendations": [
    {
      "listingId": "LISTING_ID",
      "title": "Listing Title",
      "reason": "Brief explanation why this matches their needs"
    },
    {
      "listingId": "LISTING_ID",
      "title": "Listing Title",
      "reason": "Brief explanation why this matches their needs"
    },
    {
      "listingId": "LISTING_ID",
      "title": "Listing Title",
      "reason": "Brief explanation why this matches their needs"
    }
  ]
}

MATCHING CRITERIA:
- Consider industry alignment (same or complementary industries)
- Consider company size (small/medium/startup/large)
- Prioritize listings that address their specific requests
- Balance between resources, events, collaborations, and sessions
- Favor listings from higher-tier companies when quality is similar

Return ONLY the JSON object, no other text.`;
  }

  private parseAIResponse(content: string, allListings: Listing[]): AIRecommendationResponse {
    try {
      // Parse the JSON response from AI
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const recommendations = parsed.recommendations || [];

      // Map recommendation IDs back to actual listing objects
      const topListings: Listing[] = [];
      const explanations: Record<string, string> = {};

      recommendations.forEach((rec: any) => {
        const listing = allListings.find(l => l.id === rec.listingId);
        if (listing) {
          topListings.push(listing);
          explanations[listing.id] = rec.reason;
        }
      });

      console.log(`✅ AI recommended ${topListings.length} listings`);

      return {
        topListings: topListings.slice(0, 3), // Ensure only top 3
        explanations,
      };
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI recommendations');
    }
  }
}

const aiService = new AIService();
export default aiService;
