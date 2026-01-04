import { Component } from "solid-js";
import { Title } from "@solidjs/meta";

import debounce from "@/lib/debounce";
import { PluginManager } from "./jsoncodegen-wasm32-wasip1";

import styles from "./JsonCodeGen.module.css";

const JsonCodeGen: Component = () => {
    let langSelectRef: HTMLSelectElement;
    let jsonInputRef: HTMLTextAreaElement;
    let codeOutputRef: HTMLTextAreaElement;

    const codegen = () => {
        const lang = langSelectRef.value;
        const json = jsonInputRef.value;

        PluginManager.get(
            `https://zahash.github.io/jsoncodegen-${lang}-wasm32-wasip1.wasm`,
        )
            .then((plugin) => (codeOutputRef.value = plugin.run(json)))
            .catch((e) => {
                console.error(e);
                codeOutputRef.value = e.message;
            });
    };

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
                            onchange={codegen}
                            class={styles.LangSelect}
                        >
                            <option value="java">Java</option>
                            <option value="rust">Rust</option>
                        </select>
                    </div>
                </div>

                <div class={styles.Main}>
                    <textarea
                        ref={(ele) => (jsonInputRef = ele)}
                        oninput={debounce(codegen, 300)}
                        class={styles.TextArea}
                        placeholder="Paste your JSON here"
                        spellcheck={false}
                    ></textarea>
                    <textarea
                        ref={(ele) => (codeOutputRef = ele)}
                        class={styles.TextArea}
                        readonly
                        placeholder="Generated Code"
                    ></textarea>
                </div>
            </div>
        </>
    );
};

export default JsonCodeGen;
