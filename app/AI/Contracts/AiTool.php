<?php

namespace App\AI\Contracts;

interface AiTool
{
    /**
     * Get the unique name of the tool.
     */
    public function getName(): string;

    /**
     * Get a clear description of what the tool does.
     */
    public function getDescription(): string;

    /**
     * Get the JSON Schema for the tool's parameters.
     */
    public function getParametersSchema(): array;

    /**
     * Execute the tool with the provided parameters.
     */
    public function execute(array $params): array;
}
