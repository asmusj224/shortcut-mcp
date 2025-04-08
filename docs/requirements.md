# Requirements

# MCP Server with Shortcut API Integration Requirements

General overview
The following describes the functional and non-functional features, as well as the technical requirements, for a MCP Server for system called "Shortcut MCP".

## Core Requirements
* Create an MCP server that integrates with Shortcut API to enable users to view, create, and manipulate stories across different workflows

## High-Level Requirements
### Use Case and Motivation
* **Streamlined Story Management**: Enable team members to efficiently manage their Shortcut stories without leaving their preferred development environment
* **Workflow Optimization**: Enable team members to efficently move their Shortcut stories without leaving their preffered development environment.
* **Increased Productivity**: Enable team members to create Shortcut stories and use the context from their preferred development environment.

## Mid-Level Requirements
### Process and Work Mechanisms
* **Authentication and Authorization**:
  * The Shortcut API uses token based authentication. Have the user provide teh API token as an environment variable called `SHORTCUT_API_TOKEN`. If no token is provided point the user in the direction of creating one `https://app.shortcut.com/settings/`

* **Story Management Operations**:
  * Retrieve stories from current iteration
  * Filter stories by various attributes (owner, state, labels, etc.)
  * Create new stories with appropriate fields
  * Move stories between workflow states
  * Update story attributes (description, labels, etc.)
  * Comment on stories

### Architecture, Tech Stack, and Constraints
* **Architecture**:
  * MCP stdio server

* **Tech Stack**:
  * Stdio server: Typescript with @modelcontextprotocol/sdk 


* **Constraints**:
  * API rate limiting (respect Shortcut API limits)
  * Graceful error handling and recovery

## Low-Level Requirements
### Detailed Process Steps

#### User Authentication Flow
1. User provides a token via environment variable to authentication against the shortcut API.
2. The MCP Server adds the token header called Shortcut-Token to send with each request

#### Story Retrieval Process
1. User sends request for current iteration stories
2. Server forwards the request to the shortcut API with the Shortcut-Token header
3. Server queries Shortcut API for current iteration metadata
4. Server retrieves all stories associated with the current iteration
5. Optional filtering is applied based on request parameters
6. Stories are transformed into standardized format
7. Response is returned to the user with story data

#### Story Creation Workflow
1. User submits story creation request with required fields
2. Server validates input data for completeness and correctness
3. Server transforms data into Shortcut API compatible format
4. Request is sent to Shortcut API to create story
5. Server receives confirmation and story ID
6. New story details are returned to the user

#### Story State Transition Process
1. User requests state change for a specific story
2. Server validates user permissions for the operation
3. Current workflow state is retrieved from Shortcut
4. Available transition states are determined
5. Requested transition is validated against available options
6. State transition request is sent to Shortcut API
7. Confirmation of state change is received
8. Updated story information is returned to user

I'll convert this Python code quality specification to TypeScript best practices, removing CI/CD components and incorporating ESLint and testing. Here's a revised version:

# TypeScript Development Workflow and Quality Standards

## Code Quality Requirements

### Development Workflow
- All code must pass automated quality checks before being committed
- A pre-commit hook system should be configured via Husky to validate code quality
- A comprehensive npm script configuration should be provided to streamline development tasks

### Code Formatting and Style
- All TypeScript code must follow consistent formatting via Prettier
- Import statements should be organized consistently
- Code must comply with project ESLint configuration

### Static Analysis and Type Safety
- TypeScript's strict mode must be enabled in tsconfig.json
- All functions must include complete type annotations
- All public methods and functions must have JSDoc comments

### Testing Requirements
- Unit tests must be written using Jest
- Tests must verify correct behavior of each module and function

### Documentation
- Code quality practices and tools must be documented for contributors
- Usage of code quality tools must be explained in project documentation

## Quality Assurance Configuration

The quality assurance tools and configuration are managed via:
- `tsconfig.json` for TypeScript configuration
- `.eslintrc.js` (or `.json`) for ESLint rules
- `.prettierrc.js` (or `.json`) for code formatting rules
- `.husky` directory for pre-commit hooks
- `package.json` scripts for quality checks and testing
