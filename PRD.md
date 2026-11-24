# MazeQuest Mini — Product Requirements Document

## Overview

MazeQuest Mini is a small top-down puzzle adventure game.

The player controls one character and explores a single maze level containing obstacles, interactive objects, collectibles, and simple environmental puzzles.

The goal of the first release is to create one fully playable and polished level that demonstrates the main game mechanics without making the project unnecessarily large.

The player must explore the maze, solve puzzles, avoid hazards, collect rewards, and reach the exit.

## Product Goal

The goal is to create a simple but complete browser game that demonstrates:

- Level design
- Character movement
- Collision detection
- Puzzle logic
- Interactive objects
- Collectibles
- Basic game UI
- AI-assisted development

## Target Users

MazeQuest Mini is designed for casual players who enjoy:

- Maze games
- Puzzle games
- Exploration
- Short adventure games

The controls and objectives should be easy to understand without requiring a long tutorial.

## Platform

The first release is designed as a browser-based desktop game.

Technologies:

- HTML
- CSS
- JavaScript

No backend, user account, or database is required.

# Core Features

## 1. Single Maze Level

The game contains one complete maze.

The level includes:

- Clear starting position
- Clear exit
- Walls
- Corridors
- Multiple routes
- Puzzle areas
- Optional exploration areas
- Collectibles
- Environmental hazards

The player must not be able to walk through walls or blocked objects.

## 2. Player Character

The game contains one controllable character.

The player can move:

- Up
- Down
- Left
- Right

Controls:

- WASD
- Arrow keys

Movement should feel responsive and suitable for top-down maze navigation.

## 3. Collision System

The player must collide correctly with:

- Maze walls
- Locked doors
- Closed gates
- Obstacles

The player should never be able to move through solid objects.

## 4. Puzzle One — Key and Locked Door

A locked door blocks an important path.

A key is located somewhere else in the maze.

Before collecting the key:

- The door remains locked
- The player cannot pass through it

After collecting the key:

- The key disappears
- The UI shows that the key has been collected
- The door becomes unlockable
- The door changes visually when opened

## 5. Puzzle Two — Floor Switch

A floor switch controls a gate.

When the player steps on the switch:

- The switch activates
- Its appearance changes
- The connected gate opens
- A new area becomes accessible

The player should receive clear visual feedback.

## 6. Puzzle Three — Trap Area

The maze includes a trap or hazard section.

Example hazard:

- Spikes

If the player touches the hazard:

- Visual feedback appears
- The player is moved back to a safe position
- The game continues without requiring a full restart

## 7. Collectibles

The maze contains at least five collectibles.

The first version uses purple crystals.

When a crystal is collected:

- The crystal disappears
- The collectible counter increases

The interface displays:

`CRYSTALS: X / 5`

Some crystals should be easy to find while others should reward exploration.

## 8. Exit

The maze contains a clearly visible exit.

When the player reaches the exit:

- Gameplay stops
- A Level Complete screen appears
- The number of collected crystals is displayed
- The player can restart or play again

# UI Requirements

## Start Menu

The game begins with a clickable start menu.

It contains:

- MazeQuest Mini title
- Start Game button
- How to Play button

## How to Play

The instructions explain:

- WASD / Arrow keys = movement
- Find the key
- Activate switches
- Avoid traps
- Collect crystals
- Reach the exit

## In-Game HUD

During gameplay the HUD shows:

- Crystal counter
- Key status
- Restart button

The HUD should remain small and should not block important areas of the maze.

## Level Complete Screen

The completion screen contains:

- Level Complete message
- Total crystals collected
- Play Again button
- Restart button

# Interactive Objects

## Key

- Can be collected
- Disappears after collection
- Updates the player's key state

## Locked Door

- Blocks the player before key collection
- Opens after the player has the key

## Floor Switch

- Activates when stepped on
- Changes appearance
- Opens the linked gate

## Gate

- Blocks movement while closed
- Opens when the switch is activated

## Trap

- Reacts when touched
- Gives visual feedback
- Resets player position

## Crystal

- Disappears when collected
- Updates collectible counter

## Exit

- Glows or is visually distinctive
- Triggers level completion

# User Stories

As a player, I want to move around the maze so that I can explore the level.

As a player, I want to solve puzzles so that I can access new areas.

As a player, I want to collect rewards so that exploration feels worthwhile.

As a player, I want visual feedback when I interact with objects so that I understand what has happened.

As a player, I want to restart the level easily if I want to try again.

# UI Guidelines

## Visual Style

The game should use a colorful and friendly cartoon adventure style.

The design should feel:

- Playful
- Clear
- Slightly mysterious
- Easy to read
- Easy to navigate

## Suggested Colors

- Dark green maze walls
- Beige or stone floor
- Blue player character
- Purple crystals
- Gold key
- Green switch
- Red or orange traps
- Bright glowing exit

## Typography

Use a clean sans-serif font.

Menus and buttons should be clearly readable.

## Layout

The maze should take up most of the screen.

The HUD should remain along the edge of the game area.

Menus should use simple centered panels and clearly clickable buttons.

# First Release / MVP

The first release must include:

- One maze level
- One playable character
- Four-direction movement
- Wall collision
- Locked door
- Key
- Floor switch
- Switch-controlled gate
- Trap obstacle
- At least five collectibles
- Start menu
- How to Play screen
- HUD
- Restart function
- Exit
- Level Complete screen

The MVP is considered complete when all of these features work reliably.

# Testing Requirements

Before release, verify that:

1. Start Game works.
2. How to Play works.
3. Player moves up, down, left, and right.
4. Player cannot walk through walls.
5. Player can collect the key.
6. Locked door blocks the player before the key is collected.
7. Locked door opens after the key is collected.
8. Floor switch activates.
9. Gate opens after switch activation.
10. Trap responds correctly.
11. Trap resets the player safely.
12. All collectibles can be collected.
13. Collectible counter updates.
14. Key status updates.
15. Player can reach the exit.
16. Level Complete screen appears.
17. Restart resets all game state.
18. The game has no major console errors.

# Future Features

Future versions could include:

- More levels
- Enemies
- Multiple characters
- Character abilities
- Pushable blocks
- Timed puzzles
- Secret rooms
- More traps
- Inventory system
- Sound effects
- Music
- Mobile controls
- Level timer
- High scores
- Procedural maze generation

# Development Approach

The game was developed using AI-assisted vibe coding.

Google AI Studio was used to generate and iterate on:

- Game structure
- Character movement
- Collision detection
- Puzzle logic
- UI
- Visual styling
- Interactive objects
- Debugging

AI outputs were reviewed and tested manually to ensure that the final result met the requirements of the first release.
