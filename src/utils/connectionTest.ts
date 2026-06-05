/**
 * Connection Test Suite
 * Tests connectivity and health status of all services and dependencies
 */

interface ConnectionTestResult {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  timestamp: string;
  message: string;
  details?: Record<string, any>;
}

export class ConnectionTester {
  private results: ConnectionTestResult[] = [];

  /**
   * Test Supabase connection
   */
  async testSupabaseConnection(): Promise<ConnectionTestResult> {
    const result: ConnectionTestResult = {
      service: 'Supabase',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Checking Supabase client initialization...',
    };

    try {
      // Import Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        result.status = 'warning';
        result.message = 'Supabase environment variables not configured';
        result.details = { configured: false };
        return result;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test basic connectivity
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        result.status = 'warning';
        result.message = `Supabase session check: ${error.message}`;
        result.details = { error: error.message };
      } else {
        result.message = 'Supabase connected successfully';
        result.details = { hasSession: !!data.session };
      }
    } catch (error) {
      result.status = 'error';
      result.message = `Supabase connection failed: ${String(error)}`;
      result.details = { error: String(error) };
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test React Query connectivity
   */
  testReactQuery(): ConnectionTestResult {
    const result: ConnectionTestResult = {
      service: 'React Query',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'React Query client initialized',
    };

    try {
      const { QueryClient } = require('@tanstack/react-query');
      if (QueryClient) {
        result.message = 'React Query available and ready';
        result.details = { version: '@tanstack/react-query@5.83.0' };
      }
    } catch (error) {
      result.status = 'error';
      result.message = `React Query not found: ${String(error)}`;
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test environment variables
   */
  testEnvironmentVariables(): ConnectionTestResult {
    const result: ConnectionTestResult = {
      service: 'Environment Configuration',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Checking environment variables...',
      details: {},
    };

    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
    ];

    const missingVars: string[] = [];

    requiredEnvVars.forEach((varName) => {
      const value = import.meta.env[varName];
      if (!value) {
        missingVars.push(varName);
      }
      (result.details as any)[varName] = value ? '✓ Set' : '✗ Missing';
    });

    if (missingVars.length > 0) {
      result.status = 'warning';
      result.message = `Missing environment variables: ${missingVars.join(', ')}`;
    } else {
      result.message = 'All required environment variables are set';
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test DOM and browser APIs
   */
  testBrowserAPIs(): ConnectionTestResult {
    const result: ConnectionTestResult = {
      service: 'Browser APIs',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Testing available browser APIs...',
      details: {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        localStorage_test: this.testLocalStorage(),
      },
    };

    this.results.push(result);
    return result;
  }

  /**
   * Test localStorage functionality
   */
  private testLocalStorage(): boolean {
    try {
      const testKey = '__connectivity_test__';
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return value === 'test';
    } catch {
      return false;
    }
  }

  /**
   * Test network connectivity
   */
  async testNetworkConnectivity(): Promise<ConnectionTestResult> {
    const result: ConnectionTestResult = {
      service: 'Network Connectivity',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Testing network connectivity...',
      details: {},
    };

    try {
      const response = await fetch('https://api.github.com/zen', {
        method: 'GET',
        cache: 'no-cache',
      });

      (result.details as any).github_api = response.ok ? '✓ Reachable' : '✗ Unreachable';

      if (!response.ok) {
        result.status = 'warning';
      }

      result.message = `Network connectivity: ${response.ok ? 'Online' : 'Degraded'}`;
    } catch (error) {
      result.status = 'warning';
      result.message = `Network check failed: ${String(error)}`;
      (result.details as any).network = '✗ Offline or CORS issue';
    }

    this.results.push(result);
    return result;
  }

  /**
   * Run all connection tests
   */
  async runAllTests(): Promise<ConnectionTestResult[]> {
    console.log('🔍 Starting connection tests...\n');

    // Run sync tests
    this.testReactQuery();
    this.testEnvironmentVariables();
    this.testBrowserAPIs();

    // Run async tests
    await this.testSupabaseConnection();
    await this.testNetworkConnectivity();

    console.log('\n✅ Connection tests completed\n');
    return this.results;
  }

  /**
   * Get all test results
   */
  getResults(): ConnectionTestResult[] {
    return this.results;
  }

  /**
   * Get test summary
   */
  getSummary() {
    const summary = {
      total: this.results.length,
      healthy: this.results.filter((r) => r.status === 'healthy').length,
      warnings: this.results.filter((r) => r.status === 'warning').length,
      errors: this.results.filter((r) => r.status === 'error').length,
      timestamp: new Date().toISOString(),
    };

    return summary;
  }

  /**
   * Print formatted test report
   */
  printReport(): void {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('           CONNECTION TEST REPORT');
    console.log('═══════════════════════════════════════════════════════\n');

    this.results.forEach((result) => {
      const icon =
        result.status === 'healthy'
          ? '✅'
          : result.status === 'warning'
            ? '⚠️'
            : '❌';

      console.log(`${icon} ${result.service}`);
      console.log(`   Status: ${result.status.toUpperCase()}`);
      console.log(`   Message: ${result.message}`);

      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   Details:`);
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`     - ${key}: ${JSON.stringify(value)}`);
        });
      }

      console.log('');
    });

    const summary = this.getSummary();
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Healthy: ${summary.healthy}`);
    console.log(`⚠️  Warnings: ${summary.warnings}`);
    console.log(`❌ Errors: ${summary.errors}`);
    console.log('═══════════════════════════════════════════════════════\n');
  }
}

// Export singleton instance
export const connectionTester = new ConnectionTester();
