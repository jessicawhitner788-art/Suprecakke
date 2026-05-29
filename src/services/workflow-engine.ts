/**
 * Core Workflow Engine
 * Manages workflow execution, step processing, and event handling
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import {
  WorkflowDefinition,
  WorkflowEvent,
  WorkflowExecution,
  WorkflowStatus,
  StepExecution,
  WorkflowConfig
} from '../types/workflow';

export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private config: WorkflowConfig;

  constructor(config: WorkflowConfig) {
    this.config = config;
    logger.info('WorkflowEngine initialized', { config });
  }

  /**
   * Register a workflow definition
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
    logger.info(`Workflow registered: ${workflow.name}`, { workflowId: workflow.id });
  }

  /**
   * Get a registered workflow
   */
  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Execute a workflow based on an event
   */
  async executeWorkflow(event: WorkflowEvent): Promise<WorkflowExecution> {
    const executionId = uuidv4();
    
    logger.info('Workflow execution started', {
      executionId,
      eventId: event.id,
      eventType: event.type
    });

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: '', // Will be set based on matching workflow
      eventId: event.id,
      status: WorkflowStatus.PENDING,
      steps: [],
      startTime: new Date(),
      retryCount: 0
    };

    try {
      // Find matching workflow for this event
      const workflow = this.findMatchingWorkflow(event);
      if (!workflow) {
        throw new Error(`No workflow found for event type: ${event.type}`);
      }

      execution.workflowId = workflow.id;
      execution.status = WorkflowStatus.IN_PROGRESS;

      // Execute each step in the workflow
      for (const step of workflow.steps) {
        const stepExecution = await this.executeStep(step, event, execution);
        execution.steps.push(stepExecution);

        if (stepExecution.status === WorkflowStatus.FAILED && !step.retryable) {
          throw new Error(`Step failed: ${step.name}`);
        }
      }

      execution.status = WorkflowStatus.COMPLETED;
      execution.endTime = new Date();

      logger.info('Workflow execution completed', {
        executionId,
        status: execution.status,
        duration: execution.endTime.getTime() - execution.startTime.getTime()
      });

    } catch (error) {
      execution.status = WorkflowStatus.FAILED;
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.endTime = new Date();

      logger.error('Workflow execution failed', {
        executionId,
        error: execution.error,
        retryCount: execution.retryCount
      });

      // Retry logic
      if (execution.retryCount < this.config.maxRetries) {
        execution.retryCount++;
        execution.status = WorkflowStatus.RETRY;
        logger.info('Workflow scheduled for retry', {
          executionId,
          retryCount: execution.retryCount
        });
      }
    }

    this.executions.set(executionId, execution);
    return execution;
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: any,
    event: WorkflowEvent,
    execution: WorkflowExecution
  ): Promise<StepExecution> {
    const startTime = new Date();
    const stepExecution: StepExecution = {
      stepId: step.id,
      status: WorkflowStatus.IN_PROGRESS,
      startTime
    };

    try {
      logger.info(`Executing step: ${step.name}`, {
        stepId: step.id,
        service: step.service,
        action: step.action
      });

      // Get the appropriate service handler
      const handler = await this.getStepHandler(step.service, step.action);
      const result = await handler(step.config, event);

      stepExecution.status = WorkflowStatus.COMPLETED;
      stepExecution.result = result;

      logger.info(`Step completed: ${step.name}`, {
        stepId: step.id,
        result: result
      });

    } catch (error) {
      stepExecution.status = WorkflowStatus.FAILED;
      stepExecution.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Step failed: ${step.name}`, { stepId: step.id, error: stepExecution.error });
    }

    stepExecution.endTime = new Date();
    stepExecution.duration = stepExecution.endTime.getTime() - startTime.getTime();

    return stepExecution;
  }

  /**
   * Find a matching workflow for an event
   */
  private findMatchingWorkflow(event: WorkflowEvent): WorkflowDefinition | undefined {
    for (const workflow of this.workflows.values()) {
      if (workflow.type === event.type && workflow.enabled) {
        return workflow;
      }
    }
    return undefined;
  }

  /**
   * Get the handler for a specific service action
   */
  private async getStepHandler(service: string, action: string): Promise<Function> {
    // This would be implemented with actual service handlers
    // For now, return a placeholder
    return async (config: any, event: any) => {
      logger.info(`Executing ${service}:${action}`, { config, eventType: event.type });
      return { success: true, message: `${service}:${action} executed` };
    };
  }

  /**
   * Get execution history
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions
   */
  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }
}

export default WorkflowEngine;
