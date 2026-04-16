"use client";

import { useState } from "react";

export function TextLibrary() {
  const [prompt, setPrompt] = useState("");
  const [text, setText] = useState("");

  return (
    <div className="tlg-page">
      <div className="tlg-card">
        <div className="tlg-title">AI Text Generator</div>

        <div className="tlg-grid">
          <div className="tlg-panel tlg-panel-prompt">
            <label className="tlg-label">Prompt</label>
            <textarea
              className="tlg-textarea tlg-textarea-lg"
              placeholder="Write your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="tlg-panel tlg-panel-controls">
            <div className="tlg-controls-grid">
              <div className="tlg-select-group">
                <label className="tlg-select-label">Language</label>
                <select className="tlg-select">
                  <option>English</option>
                  <option>Arabic</option>
                  <option>French</option>
                </select>
              </div>
              <div className="tlg-select-group">
                <label className="tlg-select-label">Tone</label>
                <select className="tlg-select">
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Casual</option>
                </select>
              </div>
              <div className="tlg-select-group">
                <label className="tlg-select-label">Creativity</label>
                <select className="tlg-select">
                  <option>Balanced</option>
                  <option>Low</option>
                  <option>High</option>
                </select>
              </div>
              <div className="tlg-select-group">
                <label className="tlg-select-label">Words</label>
                <select className="tlg-select">
                  <option>120</option>
                  <option>250</option>
                  <option>500</option>
                </select>
              </div>
              <div className="tlg-select-group tlg-select-full">
                <label className="tlg-select-label">Hashtags</label>
                <select className="tlg-select">
                  <option>Include</option>
                  <option>Exclude</option>
                </select>
              </div>
              <button className="tlg-generate-btn" type="button">
                Generate
              </button>
            </div>
          </div>
        </div>

        <div className="tlg-grid tlg-grid-bottom">
          <div className="tlg-panel tlg-panel-text">
            <label className="tlg-label">Text</label>
            <textarea
              className="tlg-textarea tlg-textarea-xl"
              placeholder="Generated text will appear here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="tlg-text-footer">
              <button className="tlg-icon-btn" type="button" aria-label="Emoji">
                😊
              </button>
              <div className="tlg-text-footer-right">
                <span className="tlg-count">0/63206</span>
              </div>
            </div>
          </div>

          <div className="tlg-panel tlg-panel-actions">
            <button className="tlg-action-btn" type="button">
              Rephrase
            </button>
            <button className="tlg-action-btn" type="button">
              Make shorter
            </button>
            <button className="tlg-action-btn" type="button">
              Make punchier
            </button>
            <button className="tlg-action-btn" type="button">
              Correct text
            </button>
          </div>
        </div>

        <div className="tlg-footer">
          <div className="tlg-footer-left">
            <button className="tlg-nav-btn" type="button" aria-label="Previous">
              ‹
            </button>
            <button className="tlg-nav-btn" type="button" aria-label="Next">
              ›
            </button>
          </div>
          <div className="tlg-footer-right">
            <button className="tlg-cancel-btn" type="button">
              Cancel
            </button>
            <button className="tlg-apply-btn" type="button">
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
