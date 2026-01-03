import { Component } from "solid-js";
import { Title } from "@solidjs/meta";

import { runPlugin } from './jsoncodegen-wasm32-wasip1';

import styles from './JsonCodeGen.module.css';

const JsonCodeGen: Component = () => {
    let langSelectRef: HTMLSelectElement;
    let jsonInputRef: HTMLTextAreaElement;
    let codeOutputRef: HTMLTextAreaElement;

    const onClick = () => {
        const lang = langSelectRef.value;
        const json = jsonInputRef.value;

        runPlugin(`https://zahash.github.io/jsoncodegen-${lang}-wasm32-wasip1.wasm`, json)
            .then((stdout) => codeOutputRef.value = stdout)
            .catch((e) => {
                codeOutputRef.value = e.message;
                console.error(e);
            });        
    }

    return <>
        <Title>Json Code Generator</Title>
        <div class={styles.JsonCodeGen}>
            <div class={styles.Header}>
                <h3>JSON Code Generator <a href="https://github.com/zahash/jsoncodegen" class="link">GitHub</a></h3>
                <div>
                    <label for="lang-select">Language: </label>
                    <select ref={ele => langSelectRef = ele} id="lang-select" class={styles.LangSelect}>
                        <option value="java">Java</option>
                        <option value="rust">Rust</option>
                    </select>
                    <button onClick={onClick} class={styles.GenerateBtn}>Generate</button>
                </div>
            </div>

            <div class={styles.Main}>
                <textarea ref={ele => jsonInputRef = ele} class={styles.TextArea} placeholder="Paste your JSON here" spellcheck={false}></textarea>
                <textarea ref={ele => codeOutputRef = ele} class={styles.TextArea} readonly placeholder="Generated Code"></textarea>
            </div>
        </div>
    </>;
}

export default JsonCodeGen;
