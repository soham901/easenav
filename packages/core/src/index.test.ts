import { describe, expect, it, vi } from "vitest";
import { EaseNav } from "./index";

describe("EaseNav", () => {
	it("registers entries and retrieves them", () => {
		const nav = new EaseNav();
		nav.register({ path: "/", component: "Home" });
		nav.register({ path: "/about", component: "About" });

		expect(nav.size).toBe(2);
		expect(nav.getEntries()).toHaveLength(2);
		expect(nav.getEntries()[0]?.path).toBe("/");
		expect(nav.getEntries()[1]?.path).toBe("/about");
	});

	it("auto-generates titles from paths", () => {
		const nav = new EaseNav();
		nav.register({ path: "/" });
		nav.register({ path: "/about" });
		nav.register({ path: "/user-settings" });

		expect(nav.getEntries()[0]?.title).toBe("Home");
		expect(nav.getEntries()[1]?.title).toBe("About");
		expect(nav.getEntries()[2]?.title).toBe("User Settings");
	});

	it("preserves explicit titles", () => {
		const nav = new EaseNav();
		nav.register({ path: "/about", title: "About Us" });

		expect(nav.getEntries()[0]?.title).toBe("About Us");
	});

	it("overwrites duplicate paths", () => {
		const nav = new EaseNav();
		nav.register({ path: "/about", title: "Old" });
		nav.register({ path: "/about", title: "New" });

		expect(nav.size).toBe(1);
		expect(nav.getEntries()[0]?.title).toBe("New");
	});

	it("unregisters entries", () => {
		const nav = new EaseNav();
		nav.register({ path: "/" });
		nav.register({ path: "/about" });
		nav.unregister("/about");

		expect(nav.size).toBe(1);
		expect(nav.getByPath("/about")).toBeUndefined();
	});

	it("toggles hidden state", () => {
		const nav = new EaseNav();
		nav.register({ path: "/" });
		nav.register({ path: "/about" });

		nav.toggleHidden("/about");
		expect(nav.getEntries()).toHaveLength(1);
		expect(nav.getAllEntries()).toHaveLength(2);

		nav.toggleHidden("/about");
		expect(nav.getEntries()).toHaveLength(2);
	});

	it("moves entries up and down", () => {
		const nav = new EaseNav();
		nav.register({ path: "/" });
		nav.register({ path: "/about" });
		nav.register({ path: "/users" });

		nav.move("/users", "up");
		expect(nav.getEntries().map(e => e.path)).toEqual(["/", "/users", "/about"]);

		nav.move("/", "down");
		expect(nav.getEntries().map(e => e.path)).toEqual(["/users", "/", "/about"]);
	});

	it("ignores move at boundaries", () => {
		const nav = new EaseNav();
		nav.register({ path: "/" });
		nav.register({ path: "/about" });

		nav.move("/", "up");
		expect(nav.getEntries().map(e => e.path)).toEqual(["/", "/about"]);

		nav.move("/about", "down");
		expect(nav.getEntries().map(e => e.path)).toEqual(["/", "/about"]);
	});

	it("excludes catch-all from getEntries", () => {
		const nav = new EaseNav();
		nav.register({ path: "/" });
		nav.register({ path: "*" });

		expect(nav.getEntries()).toHaveLength(1);
		expect(nav.getAllEntries()).toHaveLength(2);
	});

	it("getByPath returns the correct entry", () => {
		const nav = new EaseNav();
		nav.register({ path: "/about", title: "About" });

		expect(nav.getByPath("/about")?.title).toBe("About");
		expect(nav.getByPath("/nope")).toBeUndefined();
	});

	it("builds a nav tree with nested children", () => {
		const nav = new EaseNav();
		nav.register({ path: "/" });
		nav.register({ path: "/users" });
		nav.register({ path: "/users/active" });
		nav.register({ path: "/users/inactive" });
		nav.register({ path: "/about" });

		const tree = nav.getTree();
		expect(tree).toHaveLength(3);

		expect(tree[0]?.entry.path).toBe("/");
		expect(tree[0]?.children).toHaveLength(0);

		expect(tree[1]?.entry.path).toBe("/users");
		expect(tree[1]?.children).toHaveLength(2);
		expect(tree[1]?.children.map(c => c.path)).toEqual(["/users/active", "/users/inactive"]);

		expect(tree[2]?.entry.path).toBe("/about");
		expect(tree[2]?.children).toHaveLength(0);
	});

	it("excludes hidden entries from tree", () => {
		const nav = new EaseNav();
		nav.register({ path: "/" });
		nav.register({ path: "/users" });
		nav.register({ path: "/users/active" });

		nav.toggleHidden("/users/active");
		const tree = nav.getTree();
		expect(tree[1]?.children).toHaveLength(0);
	});

	it("notifies subscribers on changes", () => {
		const nav = new EaseNav();
		nav.register({ path: "/" });
		nav.register({ path: "/about" });

		const listener = vi.fn();
		const unsub = nav.subscribe(listener);

		nav.toggleHidden("/about");
		expect(listener).toHaveBeenCalledTimes(1);

		nav.move("/", "down");
		expect(listener).toHaveBeenCalledTimes(2);

		unsub();
		nav.toggleHidden("/about");
		expect(listener).toHaveBeenCalledTimes(2);
	});
});
