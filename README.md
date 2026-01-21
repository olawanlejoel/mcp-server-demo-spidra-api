# Building a simple MCP server using Spidra API

A Model Context Protocol (MCP) server that integrates with the [Spidra](https://spidra.io) web scraping API, enabling AI assistants like Claude to scrape and extract data from websites.

## What is Spidra?

[Spidra](https://spidra.io) is a powerful web scraping API that allows you to extract structured data from any website. It handles JavaScript rendering, proxy rotation, and intelligent data extraction—making web scraping effortless.

## What is MCP?

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open protocol that enables AI assistants to connect with external tools and data sources. This server allows Claude and other MCP-compatible AI assistants to interact with Spidra's scraping capabilities.

## Features

- 🕷️ **Submit Scrape Jobs** - Send scraping requests to Spidra API with custom extraction schemas
- 📊 **Check Job Status** - Monitor the progress and retrieve results of scraping jobs
- 🤖 **AI-Powered Extraction** - Leverage Spidra's AI to intelligently extract structured data
- ⚡ **Seamless Integration** - Works with Claude Desktop and other MCP-compatible clients

## Prerequisites

- Node.js 18+
- A Spidra API key ([Get one here](https://spidra.io))
- A Claude Desktop license ([Get one here](https://claude.ai/desktop))

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/joelolawanle/mcp-server-demo-spidra-api.git
   cd mcp-server-demo-spidra-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Spidra API key:
   ```
   SPIDRA_API_KEY=your_api_key_here
   ```

4. Build the server:
   ```bash
   npm run build
   ```

## Usage with Claude Desktop

Add this server to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "spidra": {
      "command": "node",
      "args": ["/path/to/spidra-mcp-server/build/index.js"],
      "env": {
        "SPIDRA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Available Tools

### `submit_scrape_job`

Submit a new scraping job to Spidra.

**Parameters:**
- `url` (required) - The URL to scrape
- `schema` - JSON schema defining the data to extract
- `aiExtraction` - Enable AI-powered extraction

### `get_scrape_status`

Check the status and retrieve results of a scraping job.

**Parameters:**
- `jobId` (required) - The ID of the scraping job to check

## Example Prompts

Once configured, you can ask Claude:

- "Scrape the product details from this Amazon page: [URL]"
- "Extract all contact information from this company's website"
- "Get the latest news headlines from this news site"

## Tech Stack

- **TypeScript** - Type-safe development
- **@modelcontextprotocol/sdk** - Official MCP SDK
- **Zod** - Runtime type validation

## Resources

- 📖 [Spidra Documentation](https://docs.spidra.io/)
- 🔧 [MCP Documentation](https://modelcontextprotocol.io/)
- 🎥 [YouTube Tutorial](https://youtube.com/@joelolawanle) - Watch the full tutorial on building this MCP server

## License

MIT

---

Built with ❤️ using [Spidra API](https://spidra.io) - The intelligent web scraping API
