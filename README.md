# Agents Service

Multi-agent orchestration and autonomous research service for Infinity XOS.

## Features

- **Research Agent**: Autonomous web research with crawling and analysis
- **Agent Orchestration**: Coordinate multiple AI agents for complex tasks
- **Task Management**: Queue and track agent tasks with priorities
- **Integration**: Connects to Global Index for service discovery
- **RESTful API**: Express-based HTTP API for agent operations

## Quick Start

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

```bash
# Production
npm run docker:up

# Development (hot reload)
npm run docker:up-dev
```

## API Endpoints

### Health Checks

- `GET /health` - Health check
- `GET /healthz` - Kubernetes health check
- `GET /readyz` - Readiness check

### Agent Operations

- `POST /agents/research/execute` - Execute research task
- `GET /agents/tasks` - List all tasks
- `GET /agents/tasks/:id` - Get task status
- `DELETE /agents/tasks/:id` - Cancel task

### Service Info

- `GET /` - Service information and API documentation

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `INDEX_SERVICE_URL` - Global Index service URL
- `MAX_CONCURRENT_TASKS` - Maximum concurrent agent tasks (default: 5)

## Architecture

```
agents/
├── src/
│   ├── server/          # Express HTTP server
│   ├── agents/          # Agent implementations
│   │   ├── research.ts  # Research agent
│   │   └── orchestrator.ts  # Agent orchestrator
│   ├── types/           # TypeScript types
│   └── utils/           # Utilities (queue, logging)
├── tests/               # Test suite
├── Dockerfile           # Production container
└── docker-compose.yml   # Docker orchestration
```

## Development

### Run Tests

```bash
npm test
```

### Lint

```bash
npm run lint
npm run lint:fix
```

### Build

```bash
npm run build
```

## Integration with Global Index

This service registers with the Global Index at startup and queries it for service discovery.

See: https://github.com/InfinityXOneSystems/index

## License

ISC
