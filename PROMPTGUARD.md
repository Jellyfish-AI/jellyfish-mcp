# PromptGuard

`jellyfish-mcp` supports using Meta's Llama PromptGuard 2 model to reduce the likelihood of prompt injections attacks. It is **off by default**, but we recommend configuring it before using `jellyfish-mcp` daily. See [SECURITY.md](SECURITY.md) for more.

## Enabling PromptGuard

1. Create an account on [Hugging Face](https://huggingface.co).
2. Navigate to the [PromptGuard 2 22M model](https://huggingface.co/meta-llama/Llama-Prompt-Guard-2-22M).
3. Accept Meta's terms and request access. Wait until access is granted.
4. Create a [fine-grained Hugging Face token](https://huggingface.co/settings/tokens) with **Make calls to Inference Providers** permission.
5. Set `HUGGINGFACE_API_TOKEN` in your MCP client's env block (see [INSTALL.md](INSTALL.md#configuration-variables)).

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `HUGGINGFACE_API_TOKEN` | Your Hugging Face token. PromptGuard is enabled when this is set. | — |
| `MODEL_AVAILABILITY` | Behavior when PromptGuard can't be reached. `true` allows data through (fail-open). `false` blocks data until PromptGuard responds (fail-closed). | `false` |
| `MODEL_TIMEOUT` | Seconds to wait for a PromptGuard response. | `10` |