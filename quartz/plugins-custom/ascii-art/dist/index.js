import { jsx } from "preact/jsx-runtime";

const AsciiArt = () => {
  return jsx("div", { class: "ascii-art-easteregg" },
    jsx("pre", null,
      "UNINSTALLING Obsidian\n\u2587\u2587\u2587\u2587\u2587\u2587\u2587\u2587\u2587\u2587\u2587\u2587\u2587\u2587\u25a2\n\u256d\u2501\u256e\u256d\u2501\u256e\u256d\u256e \u2571\n\u2570\u2501\u252b\u2570\u2501\u252b\u2570\u256f\u2571\u256d\u256e\n\u2570\u2501\u256f\u2570\u2501\u256f \u2571 \u2570\u256f\nCOMPLETE"
    )
  );
};

AsciiArt.css = ".ascii-art-easteregg pre{font-family:monospace;font-size:0.55rem;color:var(--gray);line-height:1.3;margin:0.5rem 0 0 0;padding:0;white-space:pre;border:none}";

export default (() => AsciiArt);
