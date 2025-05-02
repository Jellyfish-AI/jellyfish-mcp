# Threat Model
Model Context Protocol is still in its infancy, especially with regards to security. There are inherent risks in its design just as there are in `jellyfish-mcp`. We want to be super clear on what security guarantees you can expect from this and what you can not.

Given the inherent risks, we do not recommend this for daily use unless you enable PromptGuard (see `README.md`).

## Trust Assumptions
We assume that all of the following are trusted when using `jellyfish-mcp`:

1. The MCP Client
2. All other MCP servers and their outputs attached to the client
3. The user with respect to obtaining and storing/setting the Jellyfish API key.

We assume the following may be only *partially* trusted:

4. Input prompts - We assume they are authorized to read data from Jellyfish, but should not be able to cause malicious behavior on the host machine or within Jellyfish. Nor should the prompts be able to exfiltrate any cryptographic material.
5. Your Jellyfish instance and all data sources that feed into Jellyfish (JIRA, GitHub, etc.)


## On Indirect Prompt Injection

Of all the trust assumptions made above, the one least likely to be true in practice is 5. Since data from Git and JIRA is often written by many authors, it will be difficult to ensure every input is safe.

These inputs can be used to perform indirect prompt injection attacks (see: [1](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)) due to how large language models work: any response returned by an MCP tool will be, in some sense, treated as textual context which could be inadverently interpreted as an instruction by the LLM.

Thankfully, `jellyfish-mcp` supports Llama PromptGuard 2 (see: [2](https://meta-llama.github.io/PurpleLlama/LlamaFirewall/docs/documentation/scanners/prompt-guard-2)) which can detect responsees from the Jellyfish API that might include prompt injection attacks. We *highly* recommend configuring this before using daily. Keep in mind that this is a statisitical mitigation and can't catch 100% of injection attacks. If you find such novel attacks, please report them to Meta's Llama team per https://meta-llama.github.io/PurpleLlama/LlamaFirewall/docs/documentation/scanners/prompt-guard-2.

# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Reference | Supported          |
| ------- | ------------------ |
| main   | :white_check_mark:  |
| Anything else | :x:        |

## Reporting a Vulnerability

If you believe you have found a security-related vulnerability in this project, please let us know by following the instructions here: https://jellyfish.co/learn/trust-center/security-advisories-and-bulletins/ .

