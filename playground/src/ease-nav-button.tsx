import { useState, useSyncExternalStore } from "react";
import type { EaseNav } from "@easenav/core";
import "./ease-nav-button.css";

export const EaseNavButton = ({ easeNav }: { easeNav: EaseNav }) => {
	const [open, setOpen] = useState(false);
	const allEntries = useSyncExternalStore(easeNav.subscribe, easeNav.getAllEntries);
	const entries = allEntries.filter(e => e.path !== "*");

	const getDepth = (path: string) => {
		if (path === "/") return 0;
		return path.replace(/\/$/, "").split("/").length - 1;
	};

	return (
		<div className="easenav-customize">
			<button type="button" className="easenav-toggle" onClick={() => setOpen(!open)}>
				⚙ Customize
			</button>
			{open && (
				<div className="easenav-panel">
					<h3 className="easenav-panel-title">Navigation</h3>
					{entries.map((entry, i) => (
						<div
							key={entry.path}
							className={`easenav-item${entry.isHidden ? " easenav-item--hidden" : ""}`}
							style={{ paddingLeft: `${getDepth(entry.path) * 1.2}rem` }}
						>
							<div className="easenav-item-arrows">
								<button
									type="button"
									className="easenav-arrow"
									disabled={i === 0}
									onClick={() => easeNav.move(entry.path, "up")}
								>↑</button>
								<button
									type="button"
									className="easenav-arrow"
									disabled={i === entries.length - 1}
									onClick={() => easeNav.move(entry.path, "down")}
								>↓</button>
							</div>
							<label className="easenav-item-label">
								<input
									type="checkbox"
									checked={!entry.isHidden}
									onChange={() => easeNav.toggleHidden(entry.path)}
								/>
								<span className="easenav-item-path">
									{entry.title || entry.path}
									{getDepth(entry.path) > 0 && (
										<span className="easenav-item-hint">{entry.path}</span>
									)}
								</span>
							</label>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
