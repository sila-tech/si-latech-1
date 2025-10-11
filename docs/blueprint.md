# **App Name**: SilaCalc

## Core Features:

- Room Definition: Define rooms by name, length, and width using an interactive form.
- Blocks and Beams Calculation: Calculates the number of blocks and beams required for each room based on dimensions and configurable defaults (block size, beam spacing).
- Concrete Volume Calculation: Calculates the volume of concrete required for beams and topping, based on room dimensions and configurable topping thickness.
- BRC Calculation: Calculates the number of BRC rolls needed based on total area and configurable roll width and length (48m linear is user-provided).
- Invoice Generation: Generates a downloadable invoice in JSON format, including quantities for blocks, beams, concrete, and BRC rolls. Allows you to estimate construction material requirements based on the provided parameters.
- Plan Analysis: Allows users to upload building plans in PDF or DWG format, parses and interprets plan, and extracts room dimensions, labels, and other relevant details using an AI tool.
- Quote Generation: Integrates a pricing matrix for blocks, concrete, and steel, allowing the app to generate a monetary quote based on calculated quantities, using an AI tool that considers regional pricing variances.

## Style Guidelines:

- Primary color: Light blue (#B4D4FF) for a sense of calm and reliability, reflecting the precision of calculations.
- Background color: Off-white (#F9F9F9) to provide a clean and professional backdrop, ensuring readability and focus on the data.
- Accent color: Soft green (#A5D8B3) for highlighting important elements and CTAs, giving a sense of progress and positive confirmation.
- Body and headline font: 'Inter', a sans-serif font, for clear and modern readability across all text elements.
- Code font: 'Source Code Pro' for displaying JSON data, ensuring clarity.
- Employ a clear, grid-based layout to present room data and calculation results in an organized, easy-to-understand manner.
- Subtle animations on button presses.