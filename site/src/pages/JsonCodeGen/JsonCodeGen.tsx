import { Component, onMount, onCleanup } from "solid-js";
import { Title } from "@solidjs/meta";

import debounce from "@/lib/debounce";
import { PluginManager } from "./jsoncodegen-wasm32-wasip1";

import styles from "./JsonCodeGen.module.css";
import { EditorView } from "codemirror";
import { Compartment } from "@codemirror/state";
import { LanguageSupport } from "@codemirror/language";

const languageLoaders: Record<string, () => Promise<LanguageSupport>> = {
    json: () => import("@codemirror/lang-json").then((m) => m.json()),
    rust: () => import("@codemirror/lang-rust").then((m) => m.rust()),
    java: () => import("@codemirror/lang-java").then((m) => m.java()),
};

const JsonCodeGen: Component = () => {
    let jsonInputRef: HTMLDivElement;
    let codeOutputRef: HTMLDivElement;
    let langSelectRef: HTMLSelectElement;

    let inputView: EditorView | undefined;
    let outputView: EditorView | undefined;

    let langCompartment = new Compartment();

    const codegen = async () => {
        if (!inputView || !outputView) return;

        const lang = langSelectRef.value;
        const json = inputView.state.doc.toString();

        /**
         * PATH RESOLUTION STRATEGY:
         * 
         * This uses a domain-relative path (`/filename.wasm`), which makes the setup 
         * environment-agnostic provided that the site and the WASM binaries are 
         * deployed to the same domain (co-located at the root).
         * 
         * 1. Production:
         *    Works on any domain (e.g., zahash.github.io) as long as the .wasm files 
         *    are tracked/placed at the root of that same domain.
         * 
         * 2. Development (localhost):
         *    The Vite dev server intercepts this request. See `site/vite.config.ts` for the 
         *    'serve-wasm-from-target' middleware which maps this URL to the local Rust 
         *    `target/wasm32-wasip1/wasm/` directory and strips the architecture suffix.
         */
        const url = `/jsoncodegen-${lang}-wasm32-wasip1.wasm`;

        try {
            const plugin = await PluginManager.get(url);
            const result = plugin.run(json);

            outputView.dispatch({
                changes: {
                    from: 0,
                    to: outputView.state.doc.length,
                    insert: result,
                },
            });
        } catch (e: any) {
            console.error(e);
            outputView.dispatch({
                changes: {
                    from: 0,
                    to: outputView.state.doc.length,
                    insert: e.message,
                },
            });
        }
    };

    const debouncedCodegen = debounce(codegen, 300);

    const updateOutputLanguage = async () => {
        if (!outputView) return;
        const lang = langSelectRef.value;
        const extension = await languageLoaders[lang]();
        outputView.dispatch({
            effects: langCompartment.reconfigure(extension),
        });
    };

    onMount(async () => {
        // Lazy load all CodeMirror dependencies in parallel
        const [
            { EditorView, keymap, placeholder, lineNumbers },
            { EditorState },
            { defaultKeymap, history, historyKeymap },
            { oneDark },
            { indentOnInput, bracketMatching },
            { closeBrackets, autocompletion, completionKeymap },
            jsonLang,
        ] = await Promise.all([
            import("@codemirror/view"),
            import("@codemirror/state"),
            import("@codemirror/commands"),
            import("@codemirror/theme-one-dark"),
            import("@codemirror/language"),
            import("@codemirror/autocomplete"),
            languageLoaders.json(),
        ]);

        inputView = new EditorView({
            state: EditorState.create({
                doc: "",
                extensions: [
                    oneDark,
                    lineNumbers(),
                    EditorView.lineWrapping,
                    placeholder("Paste your JSON here..."),
                    history(),
                    keymap.of([...defaultKeymap, ...historyKeymap, ...completionKeymap]),
                    jsonLang,
                    indentOnInput(),
                    bracketMatching(),
                    closeBrackets(),
                    autocompletion(),
                    EditorView.updateListener.of((update: any) => {
                        if (update.docChanged) {
                            debouncedCodegen();
                        }
                    }),
                    EditorView.theme({
                        "&": { height: "100%" },
                        ".cm-scroller": { overflow: "auto" },
                    }),
                ],
            }),
            parent: jsonInputRef,
        });

        outputView = new EditorView({
            state: EditorState.create({
                doc: "",
                extensions: [
                    oneDark,
                    lineNumbers(),
                    EditorView.lineWrapping,
                    placeholder("Generated code will appear here..."),
                    EditorState.readOnly.of(true),
                    langCompartment.of([]),
                    EditorView.theme({
                        "&": { height: "100%" },
                        ".cm-scroller": { overflow: "auto" },
                    }),
                ],
            }),
            parent: codeOutputRef,
        });

        // Set initial language
        await updateOutputLanguage();
    });

    onCleanup(() => {
        inputView?.destroy();
        outputView?.destroy();
    });

    return (
        <>
            <Title>Json Code Generator</Title>
            <div class={styles.JsonCodeGen}>
                <div class={styles.Header}>
                    <h3>
                        JSON Code Generator{" "}
                        <a
                            href="https://github.com/zahash/jsoncodegen"
                            class="link"
                        >
                            GitHub
                        </a>
                    </h3>
                    <div>
                        <label for="lang-select">Language: </label>
                        <select
                            ref={(ele) => (langSelectRef = ele)}
                            id="lang-select"
                            onchange={() => {updateOutputLanguage(); codegen();}}
                            class={styles.LangSelect}
                        >
                            <option value="java">Java</option>
                            <option value="rust">Rust</option>
                        </select>
                    </div>
                </div>

                <div class={styles.Main}>
                    <div
                        ref={(ele) => (jsonInputRef = ele)}
                        class={styles.EditorContainer}
                    ></div>
                    <div
                        ref={(ele) => (codeOutputRef = ele)}
                        class={styles.EditorContainer}
                    ></div>
                </div>
            </div>
        </>
    );
};

export default JsonCodeGen;
