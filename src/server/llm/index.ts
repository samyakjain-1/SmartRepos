import { Module } from 'modelence/server';
import { generateText } from '@modelence/ai';
import { z } from 'zod';

// Type for LLM messages (following Modelence AI pattern)
interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default new Module('llm', {
  queries: {
    async generateResponse(args) {
      const { messages } = z.object({
        messages: z.array(z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
        })),
      }).parse(args);

      try {
        const response = await generateText({
          provider: 'openai',
          model: 'gpt-4o',
          messages,
        });

        return {
          response: response.text,
          success: true,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Failed to generate LLM response:', error);
        throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async answerWithContext(args) {
      const { question, context } = z.object({
        question: z.string(),
        context: z.string(),
      }).parse(args);

      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: `You are an AI assistant that helps developers understand GitHub repositories.

You are provided with relevant context extracted from the repository's README file.

Answer the user's question using only the provided context. If the answer is not present, say "I don't know" instead of guessing.

Be clear and concise. Format in markdown.`
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion:\n${question}`
        }
      ];

      try {
        const response = await generateText({
          provider: 'openai',
          model: 'gpt-4o',
          messages,
        });

        return {
          answer: response.text,
          question,
          success: true,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Failed to answer question:', error);
        throw new Error(`Failed to answer question: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async summarizeReadme(args) {
      const { readme } = z.object({
        readme: z.string(),
      }).parse(args);

      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: `You are an expert assistant that summarizes GitHub repositories for developers.

Given the raw README of a repository, generate a clean, structured summary.

Focus on:
- What the repository does
- Key features
- Technologies used
- How to install or use it (if available)
- Any unique aspects

Avoid unnecessary fluff. Write in clear markdown with short paragraphs and bullet points.`
        },
        {
          role: 'user',
          content: `Here is the README:\n\n${readme}`
        }
      ];

      try {
        const response = await generateText({
          provider: 'openai',
          model: 'gpt-4o',
          messages,
        });

        return {
          summary: response.text,
          success: true,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Failed to summarize README:', error);
        throw new Error(`Failed to summarize README: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async explainCodeBlock(args) {
      const { code, context } = z.object({
        code: z.string(),
        context: z.string(),
      }).parse(args);

      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: `You are an expert developer assistant.

You are given a block of code from a GitHub repository's README and the surrounding context.

Your job is to clearly explain what this code does, how it works, and when it should be used.

Avoid guessing. If the code cannot be interpreted confidently based on the context, say so.

Your explanation should be:
- Clear and beginner-friendly
- Structured with markdown
- Helpful for someone unfamiliar with the codebase`
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nCode Block:\n${code}`
        }
      ];

      try {
        const response = await generateText({
          provider: 'openai',
          model: 'gpt-4o',
          messages,
        });

        return {
          explanation: response.text,
          code,
          success: true,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Failed to explain code block:', error);
        throw new Error(`Failed to explain code block: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async generateRepoAnalysis(args, { user }) {
      const { owner, name, description, readmeContent, userPreferences } = z.object({
        owner: z.string(),
        name: z.string(),
        description: z.string().nullable().optional(),
        readmeContent: z.string().nullable().optional(),
        userPreferences: z.object({
          programmingLanguages: z.array(z.string()).optional(),
          experienceLevel: z.string().optional(),
          techInterests: z.array(z.string()).optional(),
          goals: z.string().optional(),
        }).optional(),
      }).parse(args);

      console.log('Generating analysis with user preferences:', userPreferences);

      // Build user preferences context
      const userContext = userPreferences ? `
User Information:
- Programming Languages: ${userPreferences.programmingLanguages?.join(', ') || 'Not specified'}
- Experience Level: ${userPreferences.experienceLevel || 'Not specified'}
- Tech Interests: ${userPreferences.techInterests?.join(', ') || 'Not specified'}
- Goals: ${userPreferences.goals || 'Not specified'}
` : '';

      // Build context exactly like devora
      const context = `
Repository Name: ${name}
Repository Owner: ${owner}
Repository Description: ${description || 'Not provided.'}

README Content (excerpt):
---
${readmeContent ? readmeContent.substring(0, 2000) + (readmeContent.length > 2000 ? '...' : '') : 'Not available.'}
---
${userContext}
`;

      const prompt = `
Analyze the technology represented by the following GitHub repository based *only* on the provided context. Your analysis should feel personal and direct, like you're giving advice to a specific developer.

${context}

${userPreferences ? 'IMPORTANT: Personalize your analysis based on the user information provided. Tailor each section to consider the user\'s programming languages, experience level, tech interests, and goals. Make specific references to the user\'s background when explaining if the technology is right for them.' : 'Create a general analysis for a typical developer.'}

Return your analysis as a JSON object with 5 insightful sections, using the EXACT questions below. Each section should have the provided title (question) and content.

Your response format:
{
  "sections": [
    {
      "title": "Is this technology right for YOU?",
      "content": "Your analysis here, written in markdown format. Takes into account the reader's specific background, current stack, and career goals. For example: 'If you're already comfortable with Python and looking to build AI agents beyond simple chatbots, this is worth your time.'"
    },
    {
      "title": "Will this tech be dead in 6 months or is it worth your time?",
      "content": "Your analysis here, written in markdown format. Cut through the hype and marketing BS. Tell the reader if they're chasing a fad or something with staying power."
    },
    {
      "title": "Can you master this over a weekend, or will it consume your life?",
      "content": "Your analysis here, written in markdown format. Give the real learning curve without sugarcoating. Help the reader decide if the time investment makes sense."
    },
    {
      "title": "How will this make you more valuable than the devs who ignore it?",
      "content": "Your analysis here, written in markdown format. Show the career/skill advantage the reader will gain. Connect the tech to their professional growth."
    },
    {
      "title": "What's the \\"aha!\\" moment that makes this worth the struggle?",
      "content": "Your analysis here, written in markdown format. Identify the payoff that makes the learning curve worthwhile. Show the light at the end of the tunnel."
    }
  ]
}

Your response must be valid JSON only, with no other text or explanation. Make your content conversational, direct, and address the reader with "you" and "your". Keep the content actionable and insightful.

IMPORTANT: Do NOT start ANY of your responses with greetings like "Hey there!", "Hi", "Hello", or similar phrases. Jump straight into the analysis.
`;

      const messages: LLMMessage[] = [
        {
          role: 'user',
          content: prompt
        }
      ];

      try {
        const response = await generateText({
          provider: 'openai',
          model: 'gpt-4o',
          messages,
        });

        try {
          const analysis = JSON.parse(response.text);
          return analysis;
        } catch (parseError) {
          console.error('Failed to parse analysis JSON:', parseError);
          
          // Try to clean the response and parse again
          let cleanedText = response.text.trim();
          
          // Remove markdown code blocks
          const codeBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            cleanedText = codeBlockMatch[1].trim();
          }
          
          // Try to extract JSON object if response has extra text
          if (!cleanedText.startsWith('{')) {
            const jsonMatch = cleanedText.match(/{[\s\S]*}/);
            if (jsonMatch) {
              cleanedText = jsonMatch[0];
            }
          }
          
          // Advanced JSON cleaning for common AI mistakes
          cleanedText = cleanedText
            // Fix unescaped quotes in content strings
            .replace(/"content":\s*"([^"]*)"([^"]*)"([^"]*)",/g, (match, p1, p2, p3) => {
              return `"content": "${p1}\\"${p2}\\"${p3}",`;
            })
            // Fix missing commas between properties
            .replace(/"\s*\n\s*"/g, '",\n    "')
            // Fix trailing commas before closing braces
            .replace(/,(\s*[}\]])/g, '$1')
            // Fix double commas
            .replace(/,,/g, ',')
            // Fix missing quotes around property names
            .replace(/(\w+):\s*"/g, '"$1": "')
            // Remove any trailing text after the main JSON object
            .replace(/}\s*[^}]*$/, '}');
          
          try {
            const analysis = JSON.parse(cleanedText);
            console.log('Successfully parsed JSON after advanced cleanup');
            console.log('Analysis structure:', JSON.stringify(analysis, null, 2));
            
            // Validate the structure
            if (!analysis.sections || !Array.isArray(analysis.sections) || analysis.sections.length === 0) {
              console.error('Invalid analysis structure - missing or empty sections array');
              throw new Error('Invalid response structure');
            }
            
            return analysis;
          } catch (secondError) {
            console.error('Failed to parse even after cleanup:', secondError);
            console.log('Cleaned text sample:', cleanedText.substring(0, 500));
            return {
              error: true,
              message: "Could not parse the AI response as JSON. Please try again later.",
              sections: [
                {
                  title: "Is this technology right for YOU?",
                  content: "We couldn't generate a detailed analysis at this time. Please check back later."
                },
                {
                  title: "Will this tech be dead in 6 months or is it worth your time?",
                  content: "Analysis unavailable due to technical issues."
                },
                {
                  title: "Can you master this over a weekend, or will it consume your life?",
                  content: "Analysis unavailable due to technical issues."
                },
                {
                  title: "How will this make you more valuable than the devs who ignore it?",
                  content: "Analysis unavailable due to technical issues."
                },
                {
                  title: "What's the 'aha!' moment that makes this worth the struggle?",
                  content: "Analysis unavailable due to technical issues."
                }
              ]
            };
          }
        }
      } catch (error) {
        console.error('Failed to generate repo analysis:', error);
        throw new Error(`Failed to generate repo analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async generateTechDescription(args) {
      const { owner, name, description, readmeContent } = z.object({
        owner: z.string(),
        name: z.string(),
        description: z.string().nullable().optional(),
        readmeContent: z.string().nullable().optional(),
      }).parse(args);

      // Build context exactly like devora
      const context = `
Repository Name: ${name}
Repository Owner: ${owner}
Original Repository Description: ${description || 'Not provided.'}

README Content (excerpt):
---
${readmeContent ? readmeContent.substring(0, 2000) + (readmeContent.length > 2000 ? '...' : '') : 'Not available.'}
---
`;

      const prompt = `
Based *only* on the provided context (including README and full repository analysis if available), generate an informative and engaging description paragraph (around 3-5 sentences) for the technology represented by the '${name}' repository owned by '${owner}'. 

${context}

Focus on summarizing the core purpose, key features, or intended use case. The tone should be suitable for a technical audience looking to understand the project quickly. Output only the description text, with no extra formatting or explanation.
`;

      const messages: LLMMessage[] = [
        {
          role: 'user',
          content: prompt
        }
      ];

      try {
        const response = await generateText({
          provider: 'openai',
          model: 'gpt-4o',
          messages,
        });

        return response.text.trim();
      } catch (error) {
        console.error('Failed to generate tech description:', error);
        throw new Error(`Failed to generate tech description: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async generateStepByStepGuide(args) {
      const { owner, name, description, readmeContent } = z.object({
        owner: z.string(),
        name: z.string(),
        description: z.string().nullable().optional(),
        readmeContent: z.string().nullable().optional(),
      }).parse(args);

      // Build context exactly like devora
      const context = `
Repository Name: ${name}
Repository Owner: ${owner}
Repository Description: ${description || 'Not provided.'}
README Content: ${readmeContent ? readmeContent.substring(0, 2000) + (readmeContent.length > 2000 ? '...(content truncated)' : '') : 'Not available.'}
`;

      const prompt = `You are an expert technical instructor tasked with creating a comprehensive step-by-step guide for learning and using the technology "${name}". 

Use the provided repository information to create a detailed, practical guide that would help developers get started with this technology. The guide should be actionable, with practical code examples where appropriate.

${context}

IMPORTANT: Return ONLY valid JSON with NO MARKDOWN FORMATTING around it. Do NOT wrap your response in markdown code blocks (e.g., \`\`\`json). The response should be exactly in this format:

{
  "title": "Complete Guide to Implementing ${name}",
  "introduction": "A thorough introduction to the technology and what the guide will cover. Explain what problems this technology solves and why someone would want to use it.",
  "steps": [
    {
      "title": "Step Title - Start with a clear action verb", 
      "content": "Detailed explanation of this step including implementation details and insights. Write this as if you're teaching someone who needs clear instructions. Minimum 3-4 sentences per step.",
      "code": "// Practical, runnable code example that demonstrates this specific step\\n// Include comments explaining key parts\\n// Make sure all quotes are properly escaped\\n// Include import statements or dependencies when relevant",
      "list": ["Key point 1 about implementation", "Common mistake to avoid", "Tip for better usage"]
    }
  ]
}

Structure your guide with 5-7 logical steps that build on each other, from setup to advanced implementation:
1. Start with installation/setup instructions
2. Basic configuration 
3. Implementing core functionality
4. Advanced features or customization
5. Deployment or integration with other tools
6. Troubleshooting common issues (optional)
7. Best practices and optimization (optional)

CRITICAL: DO NOT use double quotes inside string values unless you escape them with a backslash. For example, write \\"quoted text\\" not "quoted text" when inside a JSON string. All quotes inside strings must be escaped.

I need a raw JSON response with NO CODE BLOCKS or other formatting. Again, do NOT wrap your response in \`\`\`json blocks.

Each step should provide VERY SPECIFIC implementation details, with real code that someone could copy and use. Include exact file paths, function names, and configuration options when possible.
`;

      const messages: LLMMessage[] = [
        {
          role: 'user',
          content: prompt
        }
      ];

      try {
        const response = await generateText({
          provider: 'openai',
          model: 'gpt-4o',
          messages,
        });

        try {
          const guide = JSON.parse(response.text);
          return guide;
        } catch (parseError) {
          console.error('Failed to parse guide JSON:', parseError);
          
          // Try to clean the response and parse again
          let cleanedText = response.text.trim();
          
          // Remove markdown code blocks
          const codeBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            cleanedText = codeBlockMatch[1].trim();
          }
          
          // Try to extract JSON object if response has extra text
          if (!cleanedText.startsWith('{')) {
            const jsonMatch = cleanedText.match(/{[\s\S]*}/);
            if (jsonMatch) {
              cleanedText = jsonMatch[0];
            }
          }
          
          // Advanced JSON cleaning for common AI mistakes
          cleanedText = cleanedText
            // Fix unescaped quotes in content strings
            .replace(/"content":\s*"([^"]*)"([^"]*)"([^"]*)",/g, (match, p1, p2, p3) => {
              return `"content": "${p1}\\"${p2}\\"${p3}",`;
            })
            // Fix missing commas between properties
            .replace(/"\s*\n\s*"/g, '",\n    "')
            // Fix trailing commas before closing braces
            .replace(/,(\s*[}\]])/g, '$1')
            // Fix double commas
            .replace(/,,/g, ',')
            // Fix missing quotes around property names
            .replace(/(\w+):\s*"/g, '"$1": "')
            // Remove any trailing text after the main JSON object
            .replace(/}\s*[^}]*$/, '}');
          
          try {
            const guide = JSON.parse(cleanedText);
            console.log('Successfully parsed guide JSON after advanced cleanup');
            return guide;
          } catch (secondError) {
            console.error('Failed to parse guide even after cleanup:', secondError);
            console.log('Cleaned guide text sample:', cleanedText.substring(0, 500));
            return {
              title: `Getting Started with ${name}`,
              introduction: `This guide will help you learn how to use ${name}. Note: This is a fallback guide due to formatting issues with the AI response.`,
              steps: [
                {
                  title: "Installation",
                  content: `To use ${name}, first follow the instructions in the repository.`,
                },
                {
                  title: "Basic Usage",
                  content: "Check the README for basic usage instructions.",
                },
                {
                  title: "Additional Resources",
                  content: `Visit the GitHub repository for more details: https://github.com/${owner}/${name}`,
                },
              ],
              error: true,
              message: "Failed to parse AI response. Using fallback guide.",
            };
          }
        }
      } catch (error) {
        console.error('Failed to generate step-by-step guide:', error);
        throw new Error(`Failed to generate step-by-step guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}); 