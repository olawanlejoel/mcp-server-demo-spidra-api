import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const SPIDRA_API_BASE = "https://api.spidra.io/api";
const API_KEY = process.env.SPIDRA_API_KEY;

if (!API_KEY) {
  console.error("Error: SPIDRA_API_KEY environment variable is required");
  process.exit(1);
}

const server = new McpServer({
  name: "spidra",
  version: "1.0.0",
});

// Types for API responses
interface ScrapeJobResponse {
  status: string;
  jobId: string;
  message: string;
}

interface ScrapeStatusResponse {
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress?: {
    message: string;
    progress: number;
  };
  result?: {
    content: string | object;
    screenshots?: string[];
    stats?: {
      durationMs: number;
      captchaSolvedCount: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
  };
  error?: string;
}

// Helper function for making Spidra API requests
async function makeSpidraRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${SPIDRA_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY!,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spidra API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// Register submit_scrape_job tool
server.registerTool(
  "submit_scrape_job",
  {
    description:
      "Submit URLs for scraping with optional browser actions and AI extraction. Returns a job ID that can be used to poll for results.",
    inputSchema: {
      urls: z
        .array(
          z.object({
            url: z.string().url().describe("The URL to scrape"),
            actions: z
              .array(
                z.object({
                  type: z
                    .enum(["click", "type", "scroll", "wait", "select"])
                    .describe("The type of browser action"),
                  selector: z
                    .string()
                    .optional()
                    .describe("CSS selector for the element"),
                  value: z
                    .string()
                    .optional()
                    .describe("Value for type/select actions"),
                  duration: z
                    .number()
                    .optional()
                    .describe("Duration in ms for wait action"),
                })
              )
              .optional()
              .describe("Optional browser actions to perform before scraping"),
            cookies: z
              .array(
                z.object({
                  name: z.string(),
                  value: z.string(),
                  domain: z.string().optional(),
                })
              )
              .optional()
              .describe("Optional cookies to set before scraping"),
          })
        )
        .min(1)
        .max(3)
        .describe("Array of URLs to scrape (1-3 URLs per request)"),
      prompt: z
        .string()
        .optional()
        .describe(
          "Optional LLM prompt for extracting or transforming the scraped content"
        ),
      output: z
        .enum(["json", "markdown"])
        .optional()
        .describe("Output format for the extracted content"),
      useProxy: z
        .boolean()
        .optional()
        .describe("Enable stealth mode with proxy rotation to avoid detection"),
    },
  },
  async ({ urls, prompt, output, useProxy }) => {
    try {
      const response = await makeSpidraRequest<ScrapeJobResponse>("/scrape", {
        method: "POST",
        body: JSON.stringify({
          urls,
          prompt,
          output,
          useProxy,
        }),
      });

      return {
        content: [
          {
            type: "text",
            text: `Scrape job submitted successfully!\n\nJob ID: ${response.jobId}\nStatus: ${response.status}\nMessage: ${response.message}\n\nUse the get_scrape_status tool with this job ID to check progress and retrieve results.`,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Failed to submit scrape job: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Register get_scrape_status tool
server.registerTool(
  "get_scrape_status",
  {
    description:
      "Get the status and results of a scrape job. Poll every 2-5 seconds until status is 'completed' or 'failed'.",
    inputSchema: {
      jobId: z
        .string()
        .describe("The job ID returned from submit_scrape_job"),
    },
  },
  async ({ jobId }) => {
    try {
      const response = await makeSpidraRequest<ScrapeStatusResponse>(
        `/scrape/${jobId}`
      );

      let resultText = `Job Status: ${response.status}\n`;

      if (response.progress) {
        resultText += `Progress: ${Math.round(response.progress.progress * 100)}%\n`;
        resultText += `Message: ${response.progress.message}\n`;
      }

      if (response.status === "completed" && response.result) {
        resultText += `\n--- Results ---\n`;

        if (typeof response.result.content === "string") {
          resultText += response.result.content;
        } else {
          resultText += JSON.stringify(response.result.content, null, 2);
        }

        if (response.result.screenshots?.length) {
          resultText += `\n\nScreenshots:\n${response.result.screenshots.join("\n")}`;
        }

        if (response.result.stats) {
          resultText += `\n\n--- Stats ---\n`;
          resultText += `Duration: ${response.result.stats.durationMs}ms\n`;
          resultText += `Tokens used: ${response.result.stats.totalTokens}`;
        }
      }

      if (response.status === "failed" && response.error) {
        resultText += `\nError: ${response.error}`;
      }

      if (response.status === "waiting" || response.status === "active") {
        resultText += `\n\nJob is still processing. Call get_scrape_status again in a few seconds.`;
      }

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Failed to get scrape status: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Main function to run the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Spidra MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
