/**
 * Example script demonstrating how to use UI components with business logic
 */
import { Button } from '@joinomu/ui'

export interface ScriptConfig {
  name: string
  description: string
  version: string
}

export class ExampleScript {
  constructor(private config: ScriptConfig) {}

  execute() {
    console.log(`Executing ${this.config.name} v${this.config.version}`)
    // Business logic implementation here
  }

  renderUI() {
    // Example of using UI components in scripts
    return Button
  }
}