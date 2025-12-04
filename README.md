# Year End Project - DMA

This project is a social platform designed for the Student Bureau (BDE) to share important information and facilitate the sale of services. It consists of a backend API built with Elysia and Drizzle ORM, and a frontend interface developed with Remix, React, TypeScript, ArkUI, and Lexical. The project is fully containerized using Docker.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Available Scripts](#available-scripts)

## Features

- **Post Publication**: Allows BDE members to publish posts to share information and keep students informed.
- **Event Creation**: Users can create and view events organized by the BDE.
- **Poll Creation**: Members can create and participate in polls to gather opinions or votes.
- **Menu Proposals**: The BDE can propose drink or snack menus available for purchase.
- **Ticket Sales via Stripe**: Integration with the Stripe API for online ticket sales.
- **User Management**: System for registration, login, and profile management. Users can follow their BDE to receive the latest updates.
- **Interactions**: Users can like posts to show support.

## Technologies Used

### Backend

- **[TypeScript](https://www.typescriptlang.org/)**: A superset of JavaScript that adds static types.
- **[Elysia](https://elysiajs.com/)**: A lightweight web framework for building APIs in TypeScript.
- **[Drizzle ORM](https://orm.drizzle.team/)**: A modern TypeScript ORM used for database management.

### Frontend

- **[Remix](https://remix.run/)**: A full-stack framework for React that provides advanced route handling and server-side rendering.
- **[React](https://reactjs.org/)**: A JavaScript library for building user interfaces.
- **[ArkUI](https://arkui.dev/)**: A UI component library for React.
- **[Lexical](https://lexical.dev/)**: A rich text editor built on React for content management.

### DevOps

- **[Docker](https://www.docker.com/)**: Service containerization to simplify deployment and development environment management.

## Prerequisites

Make sure you have the following tools installed on your machine:

- **Docker**: For containerization.
- **Node.js**: Required to install dependencies and run scripts.

## Installation

1. Clone the repository:

   ```bash
   git clone git@github.com:EpitechMscProPromo2026/T-YEP-600-BDX_1.git
   cd bde-project
   ```

2. Create a .env file at the root of the project with the required environment variables. An example .env file might look like this:

   ```bash
   DATABASE_URL=postgres://user:password@localhost:5432/bde
   STRIPE_API_KEY=your-stripe-api-key
   NODE_ENV=development
   ```

3. Build and start the Docker containers:

   ```bash
   docker-compose up --build
   ```

4. Access the application at http://localhost:3000.

## Usage

Once the Docker containers are up and running, you can access the backend API at http://localhost:4000/api and the frontend at http://localhost:3000.

### Backend API

The backend API handles all CRUD operations for posts, users, events, polls, and services. It also supports Stripe integration for payment processing.

### Frontend

The user interface allows students to view posts, create and participate in events and polls, purchase products or services, and follow their BDE to stay informed about the latest news.

## Available Scripts

In the project directory, you can run the following scripts:

- _docker-compose up_: Starts all services in development mode.
- _docker-compose down_: Stops and removes the containers.
- _docker-compose build_: Rebuilds the Docker images.
