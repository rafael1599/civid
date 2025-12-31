<?php

namespace App\AI;

use App\AI\Contracts\AiTool;
use Illuminate\Support\Collection;

class ToolRegistry
{
    /** @var Collection<string, AiTool> */
    protected Collection $tools;

    public function __construct()
    {
        $this->tools = collect();
    }

    public function register(AiTool $tool): self
    {
        $this->tools->put($tool->getName(), $tool);
        return $this;
    }

    public function getTool(string $name): ?AiTool
    {
        return $this->tools->get($name);
    }

    public function all(): Collection
    {
        return $this->tools;
    }

    /**
     * Generate the schema for all registered tools to be sent to the LLM.
     */
    public function getJsonSchemaForTools(): array
    {
        return $this->tools->map(function (AiTool $tool) {
            return [
                'tool' => $tool->getName(),
                'description' => $tool->getDescription(),
                'parameters' => $tool->getParametersSchema(),
            ];
        })->values()->toArray();
    }
}
