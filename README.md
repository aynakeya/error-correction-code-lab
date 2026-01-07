# FEC Demo (Error Correction Code Lab)

An interactive Vue + Vite app for learning error correction codes by flipping bits and watching encode/decode steps in real time.

This project is designed for students with basic CS background who are new to ECC. The companion talk script is in `tutorial.md`.

## Features

- Repetition code with majority voting
- Parity check (even parity)
- Hamming code with syndrome visualization
- SEC-DED (Hamming + overall parity)
- Convolutional code with step-by-step encoder and Viterbi decoding

## Demo Workflow

1. Pick a tab (Repetition / Parity / Hamming / SEC-DED / Convolutional)
2. Input bits on the sender side
3. Click bits on the receiver side to flip them
4. Watch the decode status and step-by-step calculations

## Getting Started

### Install

```bash
pnpm install
```

### Dev Server

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Preview

```bash
pnpm preview
```

## Project Structure

- `src/` Vue app source
- `src/components/` UI + visualization components
- `src/utils/` ECC logic (Hamming, SEC-DED, Convolutional, Viterbi)
- `tutorial.md` Speaker script / lecture notes

## Notes

- If you want to present the lecture, follow `tutorial.md` and operate the UI along the script.

## Tech Stack

- Vue 3 + Vite
- TypeScript
- Tailwind CSS + DaisyUI

## Thanks

Thanks following project for initial inspiration

- [https://github.com/harryli0088/hamming-code](https://github.com/harryli0088/hamming-code)
- [*But what are Hamming codes? The origin of error correction* by 3Blue1Brown](https://www.youtube.com/watch?v=X8jsijhllIA)
- [*Hamming codes part 2: The one-line implementation* by 3Blue1Brown](https://www.youtube.com/watch?v=b3NxrZOu_CE)

## License

GPL-3.0
