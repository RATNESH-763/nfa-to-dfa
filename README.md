# NFA to DFA Converter

An interactive web application that visualizes the conversion of Nondeterministic Finite Automata (NFA) to Deterministic Finite Automata (DFA) using the subset construction algorithm.

## Overview

This application allows users to define an NFA through a user-friendly interface, validate the input, and step through the conversion process to a DFA. The conversion is visualized with interactive graphs and detailed explanations of each step.

### Key Features

- **NFA Definition Input**: Define states, alphabet, transitions (including epsilon transitions), start state, and final states
- **Preset Examples**: Load predefined NFA examples for testing
- **Real-time Validation**: Immediate feedback on invalid NFA configurations
- **Step-by-Step Conversion**: Interactive walkthrough of the subset construction algorithm
- **Graph Visualization**: Visual representation of both NFA and DFA using force-directed graphs
- **Live Preview**: See the NFA graph update as you edit the definition

## Architecture

The application is built with React and TypeScript, using modern web technologies for a responsive and interactive experience.

### Core Components

- **NFAInputPanel**: Handles user input for NFA definition, validation, and preset loading
- **StepPanel**: Displays conversion steps with navigation and explanations
- **GraphPanel**: Renders interactive graphs for NFA and DFA visualization

### Algorithm Implementation

The subset construction algorithm is implemented in `src/lib/subset-construction.ts`, which:

1. Computes epsilon-closures for NFA states
2. Performs move operations on sets of states
3. Builds DFA states as sets of NFA states
4. Records each step for educational visualization

### Data Structures

- **NFADefinition**: Represents an NFA with states, alphabet, transitions, start state, and final states
- **ConversionResult**: Contains the DFA states, transitions, and step-by-step conversion process
- **ConversionStep**: Detailed information about each algorithm step for user education

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nfa-to-dfa-convertor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Usage

1. **Define NFA**: Use the left panel to input states, alphabet, and transitions
2. **Load Preset**: Select from predefined examples to get started quickly
3. **Validate**: The application validates your NFA definition in real-time
4. **Convert**: Click "Start Conversion" to begin the subset construction process
5. **Explore Steps**: Use the center panel to navigate through conversion steps
6. **Visualize**: View the NFA and DFA graphs in the right panel

## Technologies Used

- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **D3.js**: Graph visualization
- **React Router**: Client-side routing
- **React Query**: Data fetching and state management

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm run test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License.
