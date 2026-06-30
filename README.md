# 🧮 OR Techniques – Interactive Simulator

An interactive, browser-based simulator for **Operational Research** techniques — built with vanilla HTML, CSS, and JavaScript. Solve classic OR problems step-by-step with a clean, modern UI.

## ✨ Features

| Technique | Category | Description |
|-----------|----------|-------------|
| **Hungarian Algorithm** | Assignment | Optimal assignment of tasks to agents minimising cost |
| **North-West Corner Rule (NWCR)** | Transportation | Initial basic feasible solution for transport problems |
| **Least Cost Cell (LCC)** | Transportation | Greedy initial solution based on minimum cost |
| **Vogel's Approximation Method (VAM)** | Transportation | Near-optimal initial solution using penalty-based selection |
| **Sequencing Problem** | Scheduling | Johnson's algorithm for optimal job sequencing on machines |

## 🚀 Getting Started

No build step required — just open `index.html` in your browser!

```bash
git clone https://github.com/rxxv/or-techniques-simulator.git
cd or-techniques-simulator
# Open index.html in your browser
open index.html
```

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Glassmorphism UI, animations, responsive layout
- **JavaScript (ES6+)** — All algorithm logic, no dependencies

## 📚 Algorithms Covered

- **Hungarian Algorithm** — Solves the classic assignment problem using row/column reduction and optimal line-covering
- **Transportation Methods** — Three BFS methods compared side-by-side
- **Johnson's Sequencing** — Minimises total makespan for n-job, 2-machine problems

## 📄 License

MIT © [rxxv](https://github.com/rxxv)
