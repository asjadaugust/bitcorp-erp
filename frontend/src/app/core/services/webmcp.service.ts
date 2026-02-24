import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: any;
  execute: (args: any) => Promise<any>;
}

@Injectable({
  providedIn: 'root'
})
export class WebMcpService {
  private router = inject(Router);
  private registeredTools: Map<string, any> = new Map();

  constructor() {
    this.initGlobalTools();
  }

  /**
   * Safe check for WebMCP support
   */
  get isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'modelContext' in navigator;
  }

  /**
   * Registers a tool with the browser's model context
   */
  registerTool(tool: WebMcpTool): void {
    if (!this.isSupported) return;

    try {
      // @ts-ignore - Experimental API
      navigator.modelContext.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: async (args: any) => {
          console.log(`[WebMCP] Executing tool: ${tool.name}`, args);
          return await tool.execute(args);
        }
      });
      this.registeredTools.set(tool.name, tool);
      console.log(`[WebMCP] Tool registered: ${tool.name}`);
    } catch (error) {
      console.error(`[WebMCP] Failed to register tool: ${tool.name}`, error);
    }
  }

  private initGlobalTools(): void {
    if (!this.isSupported) return;

    // Global Navigation Tool
    this.registerTool({
      name: 'navigate_to_module',
      description: 'Navigates the user to a specific module in the ERP (e.g., equipment, logistics, administration).',
      inputSchema: {
        type: 'object',
        properties: {
          module: { 
            type: 'string', 
            enum: ['equipment', 'logistics', 'administration', 'sig', 'hr', 'projects'],
            description: 'The module to navigate to'
          }
        },
        required: ['module']
      },
      execute: async (args: { module: string }) => {
        await this.router.navigate([`/${args.module}`]);
        return { success: true, message: `Navigated to ${args.module}` };
      }
    });

    // Logout Tool
    this.registerTool({
      name: 'logout_user',
      description: 'Logs the current user out of the application.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => {
        // Find AuthService dynamically to avoid circular dependency if possible, 
        // or just use router for now.
        await this.router.navigate(['/login']);
        return { success: true };
      }
    });

    // UI Metadata Tool
    this.registerTool({
      name: 'get_navigation_metrics',
      description: 'Returns the position and size of the current secondary navigation bar.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => {
        const nav = document.querySelector('.nav-container') || document.querySelector('.tab-navigation');
        if (nav) {
          const rect = nav.getBoundingClientRect();
          return {
            success: true,
            selector: nav.className,
            metrics: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              bottom: rect.bottom,
              right: rect.right
            }
          };
        }
        return { success: false, message: 'Navigation bar not found on this page' };
      }
    });
  }
}
