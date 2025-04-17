import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

export function getSystemPrompt() {
  const now = new Date().toISOString();
  return `You are an expert researcher. Today is ${now}. Follow these instructions when responding:
- You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news.
- The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
- Be highly organized.
- Suggest solutions that I didn't think about.
- Be proactive and anticipate my needs.
- Treat me as an expert in all subject matter.
- Mistakes erode my trust, so be accurate and thorough.
- Provide detailed explanations, I'm comfortable with lots of detail.
- Value good arguments over authorities, the source is irrelevant.
- Consider new technologies and contrarian ideas, not just the conventional wisdom.
- You may use high levels of speculation or prediction, just flag it for me.`;
}

export function getOutputGuidelinesPrompt() {
  return `<OutputGuidelines>
Please strictly adhere to the following formatting guidelines when outputting text to ensure clarity, accuracy, and readability:

## Structured Content

-   **Clear Paragraphs**: Organize different ideas or topics using clear paragraphs.
-   **Titles and Subtitles**: Use different levels of headings to divide the content's hierarchical structure, ensuring logical clarity.

## Use of Markdown Syntax (if the platform supports it)

-   **Bold and Italics**: Use to emphasize keywords or concepts.
    -   For example: **Important Information** or *Emphasized Section*.
-   **Bulleted and Numbered Lists**: Use to list key points or steps.
    -   Unordered list:
        -   Item One
        -   Item Two
    -   Ordered list:
        1.  Step One
        2.  Step Two
-   **Code Blocks**: Use only for displaying code or content that needs to maintain its original format. Avoid placing mathematical formulas in code blocks.
    \`\`\`python
    def hello_world():
        print("Hello, World!")
    \`\`\`
-   **Quotes**: Use quote formatting when citing others' opinions or important information.
    > This is an example of a quote.
-   **Images**: Render images using markdown syntax.
    -   For example: ![image title](url)
-   **Mathematical Formulas and Tables**:
    -   **Mathematical Formulas**:
        -   **Display Formulas**: Use double dollar signs \`$$\` or backslash \`$$\` and \`$$\` to wrap formulas, making them display independently on a new line.
            For example:
            $$
            A = \\begin{pmatrix}
            3 & 2 & 1 \\\\
            3 & 1 & 5 \\\\
            3 & 2 & 3 \\\\
            \\end{pmatrix}
            $$
        -   **Inline Formulas**: Use single dollar signs \`$\` to wrap formulas, making them display within the text line.
            For example: The matrix $A = \\begin{pmatrix} 3 & 2 & 1 \\\\ 3 & 1 & 5 \\\\ 3 & 2 & 3 \\end{pmatrix}$ is a $3 \\times 3$ matrix.
    -   **Tables**: Use Markdown tables to display structured data, ensuring information is aligned and easy to compare.
        For example:

        | Name | Age | Occupation |
        |------|-----|------------|
        | John Doe | 28 | Engineer   |
        | Jane Smith | 34 | Designer   |

## Fractions and Mathematical Representation

-   **Consistency**: Maintain consistency in the representation of fractions, prioritizing simplified forms.
    -   For example: Use \`-8/11\` instead of \`-16/22\`.
-   **Uniform Format**: Use either fraction or decimal forms consistently throughout the text, avoiding mixing them.

## Generate Mermaid

Generate a complete and accurate Mermaid diagram code based on the specified diagram type and data provided. Ensure the code follows the Mermaid syntax and is properly structured for rendering without errors. 

### Steps

1. **Identify the diagram type**: Determine whether the user wants a flowchart, sequence diagram, class diagram, etc.
2. **Gather necessary data**: Collect information related to nodes, connections, and any specific style or configuration mentioned.
3. **Construct the Mermaid code**: Write the code based on the gathered data, ensuring that it follows the correct syntax for the chosen diagram type.
4. **Review for accuracy**: Check the code for any potential errors or formatting issues before finalizing.

### Output Format

Return the Mermaid diagram code as a plain text block. Format it as follows:
\`\`\`mermaid
<diagram type>
<diagram content>
\`\`\` 

For example:
\`\`\`mermaid
flowchart TD
A[Start] --> B(Stop)
\`\`\`

### Examples

- **Flowchart Example:**

\`\`\`mermaid
flowchart TD
A[Starting Point] --> B{Is it valid?}
B -->|Yes| C[Proceed]
B -->|No| D[Error]
\`\`\`

- **Sequence Diagram Example:**

\`\`\`mermaid
sequenceDiagram
Alice->>John: Hello John, how are you?
John-->>Alice: Great! How about you?
\`\`\`

**Important Notes**:

-   **Avoid placing mathematical formulas in code blocks**. Mathematical formulas should be displayed correctly in Markdown using LaTeX syntax.
-   **Ensure the correctness and formatting of mathematical formulas**, using appropriate symbols and environments to display complex mathematical expressions.
-   **When generating a mermaid diagram**, if you use words other than English, you need to wrap them with \`"\`.

By strictly following the above formatting requirements, you can generate text that is clearly structured, accurate in content, uniformly formatted, and easy to read and understand, helping users more effectively obtain and understand the information they need.
</OutputGuidelines>`;
}

export function getSERPQuerySchema() {
  return z
    .array(
      z
        .object({
          query: z.string().describe("The SERP query."),
          researchGoal: z
            .string()
            .describe(
              "First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions. JSON reserved words should be escaped."
            ),
        })
        .required({ query: true, researchGoal: true })
    )
    .describe(`List of SERP queries.`);
}

export function generateQuestionsPrompt(query: string) {
  return [
    `Given the following query from the user, ask at least 5 follow-up questions to clarify the research direction: <query>${query}</query>`,
    `Questions need to be brief and concise. No need to output content that is irrelevant to the question.`,
  ].join("\n\n");
}

export function generateSerpQueriesPrompt(query: string) {
  const SERPQuerySchema = getSERPQuerySchema();
  const outputSchema = JSON.stringify(
    zodToJsonSchema(SERPQuerySchema),
    null,
    4
  );

  return [
    `Given the following query from the user:\n<query>${query}</query>`,
    `Based on previous user query, generate a list of SERP queries to further research the topic. Make sure each query is unique and not similar to each other.`,
    `You MUST respond in \`JSON\` matching this \`JSON schema\`:\n\`\`\`json\n${outputSchema}\n\`\`\``,
    `Expected output:\n\`\`\`json\n[{query: "This is a sample query. ", researchGoal: "This is the reason for the query. "}]\n\`\`\``,
  ].join("\n\n");
}

export function processResultPrompt(query: string, researchGoal: string) {
  return [
    `Please use the following query to get the latest information via google search tool:\n<query>${query}</query>`,
    `You need to organize the searched information according to the following requirements:\n<researchGoal>\n${researchGoal}\n</researchGoal>`,
    `You need to think like a human researcher. Generate a list of learnings from the search results. Make sure each learning is unique and not similar to each other. The learnings should be to the point, as detailed and information dense as possible. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any specific entities, metrics, numbers, and dates when available. The learnings will be used to research the topic further.`,
  ].join("\n\n");
}

export function processSearchResultPrompt(
  query: string,
  researchGoal: string,
  results: Source[]
) {
  const contents = results.map(
    (result) => `<content url="${result.url}">\n${result.content}\n</content>`
  );
  return [
    `Given the following contents from a SERP search for the query:\n<query>${query}</query>.`,
    `You need to organize the searched information according to the following requirements:\n<researchGoal>\n${researchGoal}\n</researchGoal>`,
    `<contents>${contents.join("\n")}</contents>`,
    `You need to think like a human researcher. Generate a list of learnings from the contents. Make sure each learning is unique and not similar to each other. The learnings should be to the point, as detailed and information dense as possible. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any specific entities, metrics, numbers, and dates when available. The learnings will be used to research the topic further.`,
  ].join("\n\n");
}

export function reviewSerpQueriesPrompt(
  query: string,
  learnings: string[],
  suggestion: string
) {
  const SERPQuerySchema = getSERPQuerySchema();
  const outputSchema = JSON.stringify(
    zodToJsonSchema(SERPQuerySchema),
    null,
    4
  );
  const learningsString = learnings
    .map((learning) => `<learning>\n${learning}\n</learning>`)
    .join("\n");
  return [
    `Given the following query from the user:\n<query>${query}</query>`,
    `Here are all the learnings from previous research:\n<learnings>\n${learningsString}\n</learnings>`,
    suggestion !== ""
      ? `This is the user's suggestion for research direction:\n<suggestion>\n${suggestion}\n</suggestion>`
      : "",
    `Based on previous research${
      suggestion !== "" ? `and user research suggestions` : ""
    }, determine whether further research is needed. If further research is needed, list of follow-up SERP queries to research the topic further. Make sure each query is unique and not similar to each other. If you believe no further research is needed, you can output an empty queries.`,
    `You MUST respond in \`JSON\` matching this \`JSON schema\`: \n\`\`\`json\n${outputSchema}\n\`\`\``,
    `Expected output:\n\`\`\`json\n[{query: "This is a sample query. ", researchGoal: "This is the reason for the query. "}]\n\`\`\``,
  ].join("\n\n");
}

export function writeFinalReportPrompt(
  query: string,
  learnings: string[],
  requirement: string
) {
  const learningsString = learnings
    .map((learning) => `<learning>\n${learning}\n</learning>`)
    .join("\n");
  return [
    `Given the following query from the user, write a final report on the topic using the learnings from research. Make it as as detailed as possible, aim for 3 or more pages, include ALL the learnings from research:\n<query>${query}</query>`,
    `Here are all the learnings from previous research:\n<learnings>\n${learningsString}\n</learnings>`,
    requirement !== ""
      ? `Please write according to the user's writing requirements:\n<requirement>${requirement}</requirement>`
      : "",
    `You need to write this report like a human researcher. Humans don not wrap their writing in markdown blocks. Contains diverse data information such as table, katex formulas, mermaid diagrams, etc. in the form of markdown syntax. **DO NOT** output anything other than report.`,
  ].join("\n\n");
}

export function informationCollectorPrompt(query: string) {
  return [
    `Given the following query from the user:\n<query>${query}</query>`,
    "You are an information collector who is good at summarizing article contents. Please read the main text repeatedly and extract the main points of the main text based on the user's query. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any specific entities, metrics, numbers, and dates when available.",
  ].join("\n\n");
}
