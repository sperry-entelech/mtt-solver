import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Prometheus metrics (simplified - in production, use prom-client)
interface Metrics {
  httpRequestsTotal: number;
  httpRequestDuration: Map<string, number[]>;
  httpErrorsTotal: number;
}

class MetricsCollector {
  private metrics: Metrics = {
    httpRequestsTotal: 0,
    httpRequestDuration: new Map(),
    httpErrorsTotal: 0,
  };

  public recordRequest(method: string, path: string, statusCode: number, duration: number): void {
    this.metrics.httpRequestsTotal++;
    
    const key = `${method}_${path}_${statusCode}`;
    if (!this.metrics.httpRequestDuration.has(key)) {
      this.metrics.httpRequestDuration.set(key, []);
    }
    this.metrics.httpRequestDuration.get(key)!.push(duration);

    if (statusCode >= 400) {
      this.metrics.httpErrorsTotal++;
    }
  }

  public getMetrics(): any {
    const durations: any = {};
    this.metrics.httpRequestDuration.forEach((values, key) => {
      durations[key] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99),
      };
    });

    return {
      http_requests_total: this.metrics.httpRequestsTotal,
      http_errors_total: this.metrics.httpErrorsTotal,
      http_request_duration: durations,
    };
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}

export const metricsCollector = new MetricsCollector();

// Request monitoring middleware
export function monitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const method = req.method;
  const path = req.route?.path || req.path;

  // Log request
  logger.info('Incoming request', {
    method,
    path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Record metrics
    metricsCollector.recordRequest(method, path, statusCode, duration);

    // Log response
    const logLevel = statusCode >= 400 ? 'error' : 'info';
    logger[logLevel]('Request completed', {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
}

// Metrics endpoint handler
export function metricsHandler(req: Request, res: Response): void {
  try {
    const metrics = metricsCollector.getMetrics();
    
    // Format as Prometheus metrics (simplified)
    let prometheusFormat = `# HELP http_requests_total Total number of HTTP requests\n`;
    prometheusFormat += `# TYPE http_requests_total counter\n`;
    prometheusFormat += `http_requests_total ${metrics.http_requests_total}\n\n`;
    
    prometheusFormat += `# HELP http_errors_total Total number of HTTP errors\n`;
    prometheusFormat += `# TYPE http_errors_total counter\n`;
    prometheusFormat += `http_errors_total ${metrics.http_errors_total}\n\n`;

    res.set('Content-Type', 'text/plain');
    res.send(prometheusFormat);
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
}

// Health check with detailed status
export function healthCheckHandler(req: Request, res: Response): void {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
    },
    metrics: metricsCollector.getMetrics(),
  };

  res.status(200).json(health);
}

