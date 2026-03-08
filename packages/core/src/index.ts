export type NavEntry<T = unknown> = {
	path: string;
	title?: string;
	isHidden?: boolean;
	component?: T;
};

export type NavNode<T = unknown> = {
	entry: NavEntry<T>;
	children: NavEntry<T>[];
};

type Listener = () => void;

const VALID_PATH_REGEX = /^\/.*$/;

const VALID_SPECIAL_PATHS = new Set(["*"]);

function isValidPath(path: string): boolean {
	if (VALID_SPECIAL_PATHS.has(path)) return true;
	return typeof path === "string" && VALID_PATH_REGEX.test(path);
}

export class EaseNav<T = unknown> {
	private entries: NavEntry<T>[] = [];
	private listeners: Set<Listener> = new Set();
	private cachedVisible: NavEntry<T>[] = [];
	private cachedAll: NavEntry<T>[] = [];
	private cachedTree: NavNode<T>[] = [];

	register(entry: NavEntry<T>): EaseNav<T> {
		if (!isValidPath(entry.path)) {
			throw new Error(
				`Invalid path: "${entry.path}". Path must be a non-empty string starting with "/".`,
			);
		}
		entry.title = entry.title ?? this.titleFromPath(entry.path);
		const existingIdx = this.entries.findIndex((e) => e.path === entry.path);
		if (existingIdx !== -1) {
			this.entries[existingIdx] = entry;
		} else {
			this.entries.push(entry);
		}
		this.updateSnapshots();
		return this;
	}

	registerAll(entries: NavEntry<T>[]): EaseNav<T> {
		for (const entry of entries) {
			this.register(entry);
		}
		return this;
	}

	unregister(path: string): EaseNav<T> {
		this.entries = this.entries.filter((e) => e.path !== path);
		this.updateSnapshots();
		this.notify();
		return this;
	}

	subscribe = (listener: Listener): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};

	toggleHidden(path: string): void {
		const entry = this.entries.find((e) => e.path === path);
		if (!entry) return;
		entry.isHidden = !entry.isHidden;
		for (const child of this.getChildren(path)) {
			child.isHidden = entry.isHidden;
		}
		this.notify();
	}

	isEffectivelyHidden(path: string): boolean {
		const entry = this.entries.find((e) => e.path === path);
		if (!entry) return false;
		if (entry.isHidden) return true;
		const parent = this.parentPath(path);
		if (parent && parent !== "") {
			return this.isEffectivelyHidden(parent);
		}
		return false;
	}

	canMove(path: string, direction: "up" | "down"): boolean {
		const parent = this.parentPath(path);
		const siblings = this.topLevelSiblings(parent);
		const sibIdx = siblings.findIndex((e) => e.path === path);
		if (sibIdx === -1) return false;
		return direction === "up" ? sibIdx > 0 : sibIdx < siblings.length - 1;
	}

	move(path: string, direction: "up" | "down"): void {
		if (!this.canMove(path, direction)) return;
		const parent = this.parentPath(path);
		const siblings = this.topLevelSiblings(parent);
		const sibIdx = siblings.findIndex((e) => e.path === path);
		const swapEntry = siblings[direction === "up" ? sibIdx - 1 : sibIdx + 1];
		if (!swapEntry) return;

		const blockA = this.getBlock(path);
		const blockB = this.getBlock(swapEntry.path);

		const startA = this.entries.findIndex((e) => e.path === blockA[0]?.path);
		const startB = this.entries.findIndex((e) => e.path === blockB[0]?.path);
		if (startA === -1 || startB === -1) return;

		const minStart = Math.min(startA, startB);
		const combined =
			direction === "up" ? [...blockA, ...blockB] : [...blockB, ...blockA];

		this.entries.splice(minStart, blockA.length + blockB.length, ...combined);
		this.notify();
	}

	getByPath(path: string): NavEntry<T> | undefined {
		return this.entries.find((entry) => entry.path === path);
	}

	getEntries = (): NavEntry<T>[] => {
		return this.cachedVisible;
	};

	getAllEntries = (): NavEntry<T>[] => {
		return this.cachedAll;
	};

	getTree = (): NavNode<T>[] => {
		return this.cachedTree;
	};

	get size(): number {
		return this.entries.length;
	}

	private getChildren(path: string): NavEntry<T>[] {
		if (path === "/" || path === "*") return [];
		const prefix = `${path}/`;
		return this.entries.filter((e) => e.path.startsWith(prefix));
	}

	private getBlock(path: string): NavEntry<T>[] {
		return [
			this.entries.find((e) => e.path === path),
			...this.getChildren(path),
		].filter((e): e is NavEntry<T> => e != null);
	}

	private topLevelSiblings(parent: string): NavEntry<T>[] {
		return this.entries.filter((e) => this.parentPath(e.path) === parent);
	}

	private updateSnapshots() {
		this.cachedVisible = this.entries
			.filter((entry) => !this.isEffectivelyHidden(entry.path))
			.filter((entry) => entry.path !== "*");
		this.cachedAll = [...this.entries];
		this.cachedTree = this.buildTree(this.cachedVisible);
	}

	private buildTree(entries: NavEntry<T>[]): NavNode<T>[] {
		const topLevel: NavNode<T>[] = [];
		const childMap = new Map<string, NavEntry<T>[]>();

		for (const entry of entries) {
			const segments = entry.path.replace(/^\//, "").split("/");
			if (segments.length <= 1) {
				topLevel.push({ entry, children: [] });
			} else {
				const parentPath = `/${segments[0]}`;
				const list = childMap.get(parentPath) ?? [];
				list.push(entry);
				childMap.set(parentPath, list);
			}
		}

		for (const node of topLevel) {
			node.children = childMap.get(node.entry.path) ?? [];
		}

		return topLevel;
	}

	private notify() {
		this.updateSnapshots();
		for (const listener of this.listeners) listener();
	}

	private parentPath(path: string): string {
		if (path === "/") return "";
		const parts = path.replace(/\/$/, "").split("/");
		parts.pop();
		const parent = parts.join("/");
		return parent === "" || parent === "/" ? "" : parent;
	}

	private titleFromPath(path: string): string {
		if (!path || path === "/") return "Home";
		const segment = path.replace(/^\//, "").split("/").pop() ?? path;
		if (!segment) return "Home";
		return segment
			.replace(/[-_]/g, " ")
			.replace(/\b\w/g, (c) => c.toUpperCase());
	}
}
