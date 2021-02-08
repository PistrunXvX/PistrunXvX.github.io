
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function claim_element(nodes, name, attributes, svg) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeName === name) {
                let j = 0;
                const remove = [];
                while (j < node.attributes.length) {
                    const attribute = node.attributes[j++];
                    if (!attributes[attribute.name]) {
                        remove.push(attribute.name);
                    }
                }
                for (let k = 0; k < remove.length; k++) {
                    node.removeAttribute(remove[k]);
                }
                return nodes.splice(i, 1)[0];
            }
        }
        return svg ? svg_element(name) : element(name);
    }
    function claim_text(nodes, data) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeType === 3) {
                node.data = '' + data;
                return nodes.splice(i, 1)[0];
            }
        }
        return text(data);
    }
    function claim_space(nodes) {
        return claim_text(nodes, ' ');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function claim_component(block, parent_nodes) {
        block && block.l(parent_nodes);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.7' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Header.svelte generated by Svelte v3.29.7 */

    const file = "src\\Header.svelte";

    function create_fragment(ctx) {
    	let div13;
    	let div4;
    	let div1;
    	let div0;
    	let nav0;
    	let ul0;
    	let li0;
    	let a0;
    	let t0;
    	let t1;
    	let li1;
    	let a1;
    	let t2;
    	let t3;
    	let li2;
    	let a2;
    	let t4;
    	let t5;
    	let li3;
    	let a3;
    	let t6;
    	let t7;
    	let li4;
    	let a4;
    	let t8;
    	let t9;
    	let li5;
    	let a5;
    	let t10;
    	let t11;
    	let li6;
    	let a6;
    	let t12;
    	let t13;
    	let nav1;
    	let div3;
    	let button;
    	let span0;
    	let t14;
    	let div2;
    	let a7;
    	let t15;
    	let t16;
    	let div12;
    	let div6;
    	let div5;
    	let nav2;
    	let a8;
    	let t17;
    	let t18;
    	let ul1;
    	let li7;
    	let a9;
    	let t19;
    	let t20;
    	let li8;
    	let a10;
    	let t21;
    	let t22;
    	let li9;
    	let a11;
    	let t23;
    	let t24;
    	let li10;
    	let a12;
    	let t25;
    	let t26;
    	let li11;
    	let a13;
    	let t27;
    	let t28;
    	let li12;
    	let a14;
    	let t29;
    	let t30;
    	let li13;
    	let a15;
    	let t31;
    	let t32;
    	let div11;
    	let div7;
    	let ul2;
    	let li14;
    	let a16;
    	let t33;
    	let li15;
    	let a17;
    	let t34;
    	let li16;
    	let a18;
    	let t35;
    	let li17;
    	let a19;
    	let t36;
    	let li18;
    	let a20;
    	let t37;
    	let div10;
    	let div9;
    	let h1;
    	let t38;
    	let br;
    	let t39;
    	let span1;
    	let t40;
    	let t41;
    	let div8;
    	let p0;
    	let t42;
    	let t43;
    	let a21;
    	let t44;
    	let t45;
    	let p1;
    	let t46;

    	const block = {
    		c: function create() {
    			div13 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			nav0 = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			t0 = text("О проекте");
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			t2 = text("Вы получите");
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			t4 = text("Подключиться");
    			t5 = space();
    			li3 = element("li");
    			a3 = element("a");
    			t6 = text("Тарифы");
    			t7 = space();
    			li4 = element("li");
    			a4 = element("a");
    			t8 = text("Преимущества");
    			t9 = space();
    			li5 = element("li");
    			a5 = element("a");
    			t10 = text("Лицензии");
    			t11 = space();
    			li6 = element("li");
    			a6 = element("a");
    			t12 = text("Контакты");
    			t13 = space();
    			nav1 = element("nav");
    			div3 = element("div");
    			button = element("button");
    			span0 = element("span");
    			t14 = space();
    			div2 = element("div");
    			a7 = element("a");
    			t15 = text("+8 800-100-02-03");
    			t16 = space();
    			div12 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			nav2 = element("nav");
    			a8 = element("a");
    			t17 = text("8 800-100-02-03");
    			t18 = space();
    			ul1 = element("ul");
    			li7 = element("li");
    			a9 = element("a");
    			t19 = text("О проекте");
    			t20 = space();
    			li8 = element("li");
    			a10 = element("a");
    			t21 = text("Вы получите");
    			t22 = space();
    			li9 = element("li");
    			a11 = element("a");
    			t23 = text("Подключиться");
    			t24 = space();
    			li10 = element("li");
    			a12 = element("a");
    			t25 = text("Тарифы");
    			t26 = space();
    			li11 = element("li");
    			a13 = element("a");
    			t27 = text("Преимущества");
    			t28 = space();
    			li12 = element("li");
    			a14 = element("a");
    			t29 = text("Лицензии");
    			t30 = space();
    			li13 = element("li");
    			a15 = element("a");
    			t31 = text("Контакты");
    			t32 = space();
    			div11 = element("div");
    			div7 = element("div");
    			ul2 = element("ul");
    			li14 = element("li");
    			a16 = element("a");
    			t33 = space();
    			li15 = element("li");
    			a17 = element("a");
    			t34 = space();
    			li16 = element("li");
    			a18 = element("a");
    			t35 = space();
    			li17 = element("li");
    			a19 = element("a");
    			t36 = space();
    			li18 = element("li");
    			a20 = element("a");
    			t37 = space();
    			div10 = element("div");
    			div9 = element("div");
    			h1 = element("h1");
    			t38 = text("Корпоративный онлайн-университет ");
    			br = element("br");
    			t39 = text(" на ");
    			span1 = element("span");
    			t40 = text("аутсорсинг");
    			t41 = space();
    			div8 = element("div");
    			p0 = element("p");
    			t42 = text("Доступ к системе обучения персонала компании: планирование, организация, контроль");
    			t43 = space();
    			a21 = element("a");
    			t44 = text("Подать заявку");
    			t45 = space();
    			p1 = element("p");
    			t46 = text("Доступ к 30 бизнес-тематиками и 5000 вопросам");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div13 = claim_element(nodes, "DIV", { class: true });
    			var div13_nodes = children(div13);
    			div4 = claim_element(div13_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			div1 = claim_element(div4_nodes, "DIV", { class: true, id: true });
    			var div1_nodes = children(div1);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			nav0 = claim_element(div0_nodes, "NAV", { class: true });
    			var nav0_nodes = children(nav0);
    			ul0 = claim_element(nav0_nodes, "UL", { class: true });
    			var ul0_nodes = children(ul0);
    			li0 = claim_element(ul0_nodes, "LI", { class: true });
    			var li0_nodes = children(li0);
    			a0 = claim_element(li0_nodes, "A", { href: true, class: true });
    			var a0_nodes = children(a0);
    			t0 = claim_text(a0_nodes, "О проекте");
    			a0_nodes.forEach(detach_dev);
    			li0_nodes.forEach(detach_dev);
    			t1 = claim_space(ul0_nodes);
    			li1 = claim_element(ul0_nodes, "LI", { class: true });
    			var li1_nodes = children(li1);
    			a1 = claim_element(li1_nodes, "A", { href: true, class: true });
    			var a1_nodes = children(a1);
    			t2 = claim_text(a1_nodes, "Вы получите");
    			a1_nodes.forEach(detach_dev);
    			li1_nodes.forEach(detach_dev);
    			t3 = claim_space(ul0_nodes);
    			li2 = claim_element(ul0_nodes, "LI", { class: true });
    			var li2_nodes = children(li2);
    			a2 = claim_element(li2_nodes, "A", { href: true, class: true });
    			var a2_nodes = children(a2);
    			t4 = claim_text(a2_nodes, "Подключиться");
    			a2_nodes.forEach(detach_dev);
    			li2_nodes.forEach(detach_dev);
    			t5 = claim_space(ul0_nodes);
    			li3 = claim_element(ul0_nodes, "LI", { class: true });
    			var li3_nodes = children(li3);
    			a3 = claim_element(li3_nodes, "A", { href: true, class: true });
    			var a3_nodes = children(a3);
    			t6 = claim_text(a3_nodes, "Тарифы");
    			a3_nodes.forEach(detach_dev);
    			li3_nodes.forEach(detach_dev);
    			t7 = claim_space(ul0_nodes);
    			li4 = claim_element(ul0_nodes, "LI", { class: true });
    			var li4_nodes = children(li4);
    			a4 = claim_element(li4_nodes, "A", { href: true, class: true });
    			var a4_nodes = children(a4);
    			t8 = claim_text(a4_nodes, "Преимущества");
    			a4_nodes.forEach(detach_dev);
    			li4_nodes.forEach(detach_dev);
    			t9 = claim_space(ul0_nodes);
    			li5 = claim_element(ul0_nodes, "LI", { class: true });
    			var li5_nodes = children(li5);
    			a5 = claim_element(li5_nodes, "A", { href: true, class: true });
    			var a5_nodes = children(a5);
    			t10 = claim_text(a5_nodes, "Лицензии");
    			a5_nodes.forEach(detach_dev);
    			li5_nodes.forEach(detach_dev);
    			t11 = claim_space(ul0_nodes);
    			li6 = claim_element(ul0_nodes, "LI", { class: true });
    			var li6_nodes = children(li6);
    			a6 = claim_element(li6_nodes, "A", { href: true, class: true });
    			var a6_nodes = children(a6);
    			t12 = claim_text(a6_nodes, "Контакты");
    			a6_nodes.forEach(detach_dev);
    			li6_nodes.forEach(detach_dev);
    			ul0_nodes.forEach(detach_dev);
    			nav0_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			t13 = claim_space(div4_nodes);
    			nav1 = claim_element(div4_nodes, "NAV", { class: true });
    			var nav1_nodes = children(nav1);
    			div3 = claim_element(nav1_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);

    			button = claim_element(div3_nodes, "BUTTON", {
    				class: true,
    				type: true,
    				"data-toggle": true,
    				"data-target": true,
    				"aria-controls": true,
    				"aria-expanded": true,
    				"aria-label": true
    			});

    			var button_nodes = children(button);
    			span0 = claim_element(button_nodes, "SPAN", { class: true });
    			children(span0).forEach(detach_dev);
    			button_nodes.forEach(detach_dev);
    			t14 = claim_space(div3_nodes);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			a7 = claim_element(div2_nodes, "A", { href: true, class: true });
    			var a7_nodes = children(a7);
    			t15 = claim_text(a7_nodes, "+8 800-100-02-03");
    			a7_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			nav1_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			t16 = claim_space(div13_nodes);
    			div12 = claim_element(div13_nodes, "DIV", { class: true, id: true });
    			var div12_nodes = children(div12);
    			div6 = claim_element(div12_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			div5 = claim_element(div6_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			nav2 = claim_element(div5_nodes, "NAV", { class: true });
    			var nav2_nodes = children(nav2);
    			a8 = claim_element(nav2_nodes, "A", { href: true, class: true });
    			var a8_nodes = children(a8);
    			t17 = claim_text(a8_nodes, "8 800-100-02-03");
    			a8_nodes.forEach(detach_dev);
    			t18 = claim_space(nav2_nodes);
    			ul1 = claim_element(nav2_nodes, "UL", { class: true });
    			var ul1_nodes = children(ul1);
    			li7 = claim_element(ul1_nodes, "LI", { class: true });
    			var li7_nodes = children(li7);
    			a9 = claim_element(li7_nodes, "A", { href: true, class: true });
    			var a9_nodes = children(a9);
    			t19 = claim_text(a9_nodes, "О проекте");
    			a9_nodes.forEach(detach_dev);
    			li7_nodes.forEach(detach_dev);
    			t20 = claim_space(ul1_nodes);
    			li8 = claim_element(ul1_nodes, "LI", { class: true });
    			var li8_nodes = children(li8);
    			a10 = claim_element(li8_nodes, "A", { href: true, class: true });
    			var a10_nodes = children(a10);
    			t21 = claim_text(a10_nodes, "Вы получите");
    			a10_nodes.forEach(detach_dev);
    			li8_nodes.forEach(detach_dev);
    			t22 = claim_space(ul1_nodes);
    			li9 = claim_element(ul1_nodes, "LI", { class: true });
    			var li9_nodes = children(li9);
    			a11 = claim_element(li9_nodes, "A", { href: true, class: true });
    			var a11_nodes = children(a11);
    			t23 = claim_text(a11_nodes, "Подключиться");
    			a11_nodes.forEach(detach_dev);
    			li9_nodes.forEach(detach_dev);
    			t24 = claim_space(ul1_nodes);
    			li10 = claim_element(ul1_nodes, "LI", { class: true });
    			var li10_nodes = children(li10);
    			a12 = claim_element(li10_nodes, "A", { href: true, class: true });
    			var a12_nodes = children(a12);
    			t25 = claim_text(a12_nodes, "Тарифы");
    			a12_nodes.forEach(detach_dev);
    			li10_nodes.forEach(detach_dev);
    			t26 = claim_space(ul1_nodes);
    			li11 = claim_element(ul1_nodes, "LI", { class: true });
    			var li11_nodes = children(li11);
    			a13 = claim_element(li11_nodes, "A", { href: true, class: true });
    			var a13_nodes = children(a13);
    			t27 = claim_text(a13_nodes, "Преимущества");
    			a13_nodes.forEach(detach_dev);
    			li11_nodes.forEach(detach_dev);
    			t28 = claim_space(ul1_nodes);
    			li12 = claim_element(ul1_nodes, "LI", { class: true });
    			var li12_nodes = children(li12);
    			a14 = claim_element(li12_nodes, "A", { href: true, class: true });
    			var a14_nodes = children(a14);
    			t29 = claim_text(a14_nodes, "Лицензии");
    			a14_nodes.forEach(detach_dev);
    			li12_nodes.forEach(detach_dev);
    			t30 = claim_space(ul1_nodes);
    			li13 = claim_element(ul1_nodes, "LI", { class: true });
    			var li13_nodes = children(li13);
    			a15 = claim_element(li13_nodes, "A", { href: true, class: true });
    			var a15_nodes = children(a15);
    			t31 = claim_text(a15_nodes, "Контакты");
    			a15_nodes.forEach(detach_dev);
    			li13_nodes.forEach(detach_dev);
    			ul1_nodes.forEach(detach_dev);
    			nav2_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			div6_nodes.forEach(detach_dev);
    			t32 = claim_space(div12_nodes);
    			div11 = claim_element(div12_nodes, "DIV", { class: true });
    			var div11_nodes = children(div11);
    			div7 = claim_element(div11_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			ul2 = claim_element(div7_nodes, "UL", { class: true });
    			var ul2_nodes = children(ul2);
    			li14 = claim_element(ul2_nodes, "LI", { class: true });
    			var li14_nodes = children(li14);
    			a16 = claim_element(li14_nodes, "A", { class: true, href: true, target: true });
    			children(a16).forEach(detach_dev);
    			li14_nodes.forEach(detach_dev);
    			t33 = claim_space(ul2_nodes);
    			li15 = claim_element(ul2_nodes, "LI", { class: true });
    			var li15_nodes = children(li15);
    			a17 = claim_element(li15_nodes, "A", { class: true, href: true, target: true });
    			children(a17).forEach(detach_dev);
    			li15_nodes.forEach(detach_dev);
    			t34 = claim_space(ul2_nodes);
    			li16 = claim_element(ul2_nodes, "LI", { class: true });
    			var li16_nodes = children(li16);
    			a18 = claim_element(li16_nodes, "A", { class: true, href: true, target: true });
    			children(a18).forEach(detach_dev);
    			li16_nodes.forEach(detach_dev);
    			t35 = claim_space(ul2_nodes);
    			li17 = claim_element(ul2_nodes, "LI", { class: true });
    			var li17_nodes = children(li17);
    			a19 = claim_element(li17_nodes, "A", { class: true, href: true, target: true });
    			children(a19).forEach(detach_dev);
    			li17_nodes.forEach(detach_dev);
    			t36 = claim_space(ul2_nodes);
    			li18 = claim_element(ul2_nodes, "LI", { class: true });
    			var li18_nodes = children(li18);
    			a20 = claim_element(li18_nodes, "A", { class: true, href: true, target: true });
    			children(a20).forEach(detach_dev);
    			li18_nodes.forEach(detach_dev);
    			ul2_nodes.forEach(detach_dev);
    			div7_nodes.forEach(detach_dev);
    			t37 = claim_space(div11_nodes);
    			div10 = claim_element(div11_nodes, "DIV", { class: true });
    			var div10_nodes = children(div10);
    			div9 = claim_element(div10_nodes, "DIV", { class: true });
    			var div9_nodes = children(div9);
    			h1 = claim_element(div9_nodes, "H1", { class: true });
    			var h1_nodes = children(h1);
    			t38 = claim_text(h1_nodes, "Корпоративный онлайн-университет ");
    			br = claim_element(h1_nodes, "BR", {});
    			t39 = claim_text(h1_nodes, " на ");
    			span1 = claim_element(h1_nodes, "SPAN", { class: true });
    			var span1_nodes = children(span1);
    			t40 = claim_text(span1_nodes, "аутсорсинг");
    			span1_nodes.forEach(detach_dev);
    			h1_nodes.forEach(detach_dev);
    			t41 = claim_space(div9_nodes);
    			div8 = claim_element(div9_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);
    			p0 = claim_element(div8_nodes, "P", { class: true });
    			var p0_nodes = children(p0);
    			t42 = claim_text(p0_nodes, "Доступ к системе обучения персонала компании: планирование, организация, контроль");
    			p0_nodes.forEach(detach_dev);
    			t43 = claim_space(div8_nodes);

    			a21 = claim_element(div8_nodes, "A", {
    				type: true,
    				class: true,
    				"data-toggle": true,
    				"data-target": true
    			});

    			var a21_nodes = children(a21);
    			t44 = claim_text(a21_nodes, "Подать заявку");
    			a21_nodes.forEach(detach_dev);
    			t45 = claim_space(div8_nodes);
    			p1 = claim_element(div8_nodes, "P", { class: true });
    			var p1_nodes = children(p1);
    			t46 = claim_text(p1_nodes, "Доступ к 30 бизнес-тематиками и 5000 вопросам");
    			p1_nodes.forEach(detach_dev);
    			div8_nodes.forEach(detach_dev);
    			div9_nodes.forEach(detach_dev);
    			div10_nodes.forEach(detach_dev);
    			div11_nodes.forEach(detach_dev);
    			div12_nodes.forEach(detach_dev);
    			div13_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(a0, "href", "#about_us");
    			attr_dev(a0, "class", "svelte-gj2q75");
    			add_location(a0, file, 6, 28, 270);
    			attr_dev(li0, "class", "svelte-gj2q75");
    			add_location(li0, file, 6, 24, 266);
    			attr_dev(a1, "href", "#youGet");
    			attr_dev(a1, "class", "svelte-gj2q75");
    			add_location(a1, file, 7, 28, 338);
    			attr_dev(li1, "class", "svelte-gj2q75");
    			add_location(li1, file, 7, 24, 334);
    			attr_dev(a2, "href", "#connect_us");
    			attr_dev(a2, "class", "svelte-gj2q75");
    			add_location(a2, file, 8, 28, 406);
    			attr_dev(li2, "class", "svelte-gj2q75");
    			add_location(li2, file, 8, 24, 402);
    			attr_dev(a3, "href", "#price");
    			attr_dev(a3, "class", "svelte-gj2q75");
    			add_location(a3, file, 9, 28, 479);
    			attr_dev(li3, "class", "svelte-gj2q75");
    			add_location(li3, file, 9, 24, 475);
    			attr_dev(a4, "href", "#advantage");
    			attr_dev(a4, "class", "svelte-gj2q75");
    			add_location(a4, file, 10, 28, 541);
    			attr_dev(li4, "class", "svelte-gj2q75");
    			add_location(li4, file, 10, 24, 537);
    			attr_dev(a5, "href", "#sertificats");
    			attr_dev(a5, "class", "svelte-gj2q75");
    			add_location(a5, file, 11, 28, 613);
    			attr_dev(li5, "class", "svelte-gj2q75");
    			add_location(li5, file, 11, 24, 609);
    			attr_dev(a6, "href", "#contacts");
    			attr_dev(a6, "class", "svelte-gj2q75");
    			add_location(a6, file, 12, 28, 683);
    			attr_dev(li6, "class", "svelte-gj2q75");
    			add_location(li6, file, 12, 24, 679);
    			attr_dev(ul0, "class", "svelte-gj2q75");
    			add_location(ul0, file, 5, 20, 236);
    			attr_dev(nav0, "class", "mobile__nav__menu svelte-gj2q75");
    			add_location(nav0, file, 4, 16, 183);
    			attr_dev(div0, "class", "bg-light p-4");
    			add_location(div0, file, 3, 12, 139);
    			attr_dev(div1, "class", "collapse");
    			attr_dev(div1, "id", "navbarToggleExternalContent");
    			add_location(div1, file, 2, 8, 70);
    			attr_dev(span0, "class", "navbar-toggler-icon");
    			add_location(span0, file, 20, 16, 1148);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-toggle", "collapse");
    			attr_dev(button, "data-target", "#navbarToggleExternalContent");
    			attr_dev(button, "aria-controls", "navbarToggleExternalContent");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file, 19, 14, 922);
    			attr_dev(a7, "href", "tel:+88001000203");
    			attr_dev(a7, "class", "svelte-gj2q75");
    			add_location(a7, file, 23, 16, 1272);
    			attr_dev(div2, "class", "phone__nav svelte-gj2q75");
    			add_location(div2, file, 22, 14, 1230);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file, 18, 12, 877);
    			attr_dev(nav1, "class", "navbar navbar-light bg-light svelte-gj2q75");
    			add_location(nav1, file, 17, 10, 821);
    			attr_dev(div4, "class", "mobile__nav svelte-gj2q75");
    			add_location(div4, file, 1, 4, 35);
    			attr_dev(a8, "href", "tel:+88001000203");
    			attr_dev(a8, "class", "desc_number svelte-gj2q75");
    			add_location(a8, file, 32, 20, 1552);
    			attr_dev(a9, "href", "#about_Us");
    			attr_dev(a9, "class", "svelte-gj2q75");
    			add_location(a9, file, 34, 28, 1674);
    			attr_dev(li7, "class", "svelte-gj2q75");
    			add_location(li7, file, 34, 24, 1670);
    			attr_dev(a10, "href", "#youGet");
    			attr_dev(a10, "class", "svelte-gj2q75");
    			add_location(a10, file, 35, 28, 1742);
    			attr_dev(li8, "class", "svelte-gj2q75");
    			add_location(li8, file, 35, 24, 1738);
    			attr_dev(a11, "href", "#connect_us");
    			attr_dev(a11, "class", "svelte-gj2q75");
    			add_location(a11, file, 36, 28, 1810);
    			attr_dev(li9, "class", "svelte-gj2q75");
    			add_location(li9, file, 36, 24, 1806);
    			attr_dev(a12, "href", "#price");
    			attr_dev(a12, "class", "svelte-gj2q75");
    			add_location(a12, file, 37, 28, 1883);
    			attr_dev(li10, "class", "svelte-gj2q75");
    			add_location(li10, file, 37, 24, 1879);
    			attr_dev(a13, "href", "#advantage");
    			attr_dev(a13, "class", "svelte-gj2q75");
    			add_location(a13, file, 38, 28, 1945);
    			attr_dev(li11, "class", "svelte-gj2q75");
    			add_location(li11, file, 38, 24, 1941);
    			attr_dev(a14, "href", "#sertificats");
    			attr_dev(a14, "class", "svelte-gj2q75");
    			add_location(a14, file, 39, 28, 2017);
    			attr_dev(li12, "class", "svelte-gj2q75");
    			add_location(li12, file, 39, 24, 2013);
    			attr_dev(a15, "href", "#contacts");
    			attr_dev(a15, "class", "svelte-gj2q75");
    			add_location(a15, file, 40, 28, 2087);
    			attr_dev(li13, "class", "svelte-gj2q75");
    			add_location(li13, file, 40, 24, 2083);
    			attr_dev(ul1, "class", "svelte-gj2q75");
    			add_location(ul1, file, 33, 20, 1640);
    			attr_dev(nav2, "class", "svelte-gj2q75");
    			add_location(nav2, file, 31, 16, 1525);
    			attr_dev(div5, "class", "col");
    			add_location(div5, file, 30, 12, 1490);
    			attr_dev(div6, "class", "row dekstop__nav svelte-gj2q75");
    			add_location(div6, file, 29, 8, 1446);
    			attr_dev(a16, "class", "fb__icon svelte-gj2q75");
    			attr_dev(a16, "href", "https://www.facebook.com/uprav");
    			attr_dev(a16, "target", "_blank");
    			add_location(a16, file, 48, 24, 2370);
    			attr_dev(li14, "class", "svelte-gj2q75");
    			add_location(li14, file, 48, 20, 2366);
    			attr_dev(a17, "class", "vk__icon svelte-gj2q75");
    			attr_dev(a17, "href", "https://vk.com/rusuprav");
    			attr_dev(a17, "target", "_blank");
    			add_location(a17, file, 49, 24, 2479);
    			attr_dev(li15, "class", "svelte-gj2q75");
    			add_location(li15, file, 49, 20, 2475);
    			attr_dev(a18, "class", "inst__icon svelte-gj2q75");
    			attr_dev(a18, "href", "https://www.instagram.com/rusuprav/");
    			attr_dev(a18, "target", "_blank");
    			add_location(a18, file, 50, 24, 2581);
    			attr_dev(li16, "class", "svelte-gj2q75");
    			add_location(li16, file, 50, 20, 2577);
    			attr_dev(a19, "class", "yt__icon svelte-gj2q75");
    			attr_dev(a19, "href", "https://www.youtube.com/user/TheRSManagement");
    			attr_dev(a19, "target", "_blank");
    			add_location(a19, file, 51, 24, 2697);
    			attr_dev(li17, "class", "svelte-gj2q75");
    			add_location(li17, file, 51, 20, 2693);
    			attr_dev(a20, "class", "tg__icon svelte-gj2q75");
    			attr_dev(a20, "href", " https://web.telegram.org/#/im?p=@rusuprav");
    			attr_dev(a20, "target", "_blank");
    			add_location(a20, file, 52, 24, 2820);
    			attr_dev(li18, "class", "svelte-gj2q75");
    			add_location(li18, file, 52, 20, 2816);
    			attr_dev(ul2, "class", "social__icon svelte-gj2q75");
    			add_location(ul2, file, 47, 16, 2319);
    			attr_dev(div7, "class", "col-3 remove__sm align-self-center");
    			add_location(div7, file, 46, 12, 2253);
    			add_location(br, file, 58, 57, 3128);
    			attr_dev(span1, "class", "underline svelte-gj2q75");
    			add_location(span1, file, 58, 65, 3136);
    			attr_dev(h1, "class", "svelte-gj2q75");
    			add_location(h1, file, 57, 20, 3065);
    			attr_dev(p0, "class", "first_margin svelte-gj2q75");
    			add_location(p0, file, 61, 24, 3285);
    			attr_dev(a21, "type", "button");
    			attr_dev(a21, "class", "emergence svelte-gj2q75");
    			attr_dev(a21, "data-toggle", "modal");
    			attr_dev(a21, "data-target", "#first__modal__header");
    			add_location(a21, file, 64, 24, 3475);
    			attr_dev(p1, "class", "second_margin svelte-gj2q75");
    			add_location(p1, file, 65, 24, 3609);
    			attr_dev(div8, "class", "sub__text emergence svelte-gj2q75");
    			add_location(div8, file, 60, 20, 3226);
    			attr_dev(div9, "class", "main__text emergence svelte-gj2q75");
    			add_location(div9, file, 56, 16, 3009);
    			attr_dev(div10, "class", "col-9");
    			add_location(div10, file, 55, 12, 2972);
    			attr_dev(div11, "class", "row ");
    			add_location(div11, file, 45, 8, 2221);
    			attr_dev(div12, "class", "container-fluid");
    			attr_dev(div12, "id", "main");
    			add_location(div12, file, 28, 4, 1397);
    			attr_dev(div13, "class", "main__container svelte-gj2q75");
    			add_location(div13, file, 0, 0, 0);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, nav0);
    			append_dev(nav0, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a0);
    			append_dev(a0, t0);
    			append_dev(ul0, t1);
    			append_dev(ul0, li1);
    			append_dev(li1, a1);
    			append_dev(a1, t2);
    			append_dev(ul0, t3);
    			append_dev(ul0, li2);
    			append_dev(li2, a2);
    			append_dev(a2, t4);
    			append_dev(ul0, t5);
    			append_dev(ul0, li3);
    			append_dev(li3, a3);
    			append_dev(a3, t6);
    			append_dev(ul0, t7);
    			append_dev(ul0, li4);
    			append_dev(li4, a4);
    			append_dev(a4, t8);
    			append_dev(ul0, t9);
    			append_dev(ul0, li5);
    			append_dev(li5, a5);
    			append_dev(a5, t10);
    			append_dev(ul0, t11);
    			append_dev(ul0, li6);
    			append_dev(li6, a6);
    			append_dev(a6, t12);
    			append_dev(div4, t13);
    			append_dev(div4, nav1);
    			append_dev(nav1, div3);
    			append_dev(div3, button);
    			append_dev(button, span0);
    			append_dev(div3, t14);
    			append_dev(div3, div2);
    			append_dev(div2, a7);
    			append_dev(a7, t15);
    			append_dev(div13, t16);
    			append_dev(div13, div12);
    			append_dev(div12, div6);
    			append_dev(div6, div5);
    			append_dev(div5, nav2);
    			append_dev(nav2, a8);
    			append_dev(a8, t17);
    			append_dev(nav2, t18);
    			append_dev(nav2, ul1);
    			append_dev(ul1, li7);
    			append_dev(li7, a9);
    			append_dev(a9, t19);
    			append_dev(ul1, t20);
    			append_dev(ul1, li8);
    			append_dev(li8, a10);
    			append_dev(a10, t21);
    			append_dev(ul1, t22);
    			append_dev(ul1, li9);
    			append_dev(li9, a11);
    			append_dev(a11, t23);
    			append_dev(ul1, t24);
    			append_dev(ul1, li10);
    			append_dev(li10, a12);
    			append_dev(a12, t25);
    			append_dev(ul1, t26);
    			append_dev(ul1, li11);
    			append_dev(li11, a13);
    			append_dev(a13, t27);
    			append_dev(ul1, t28);
    			append_dev(ul1, li12);
    			append_dev(li12, a14);
    			append_dev(a14, t29);
    			append_dev(ul1, t30);
    			append_dev(ul1, li13);
    			append_dev(li13, a15);
    			append_dev(a15, t31);
    			append_dev(div12, t32);
    			append_dev(div12, div11);
    			append_dev(div11, div7);
    			append_dev(div7, ul2);
    			append_dev(ul2, li14);
    			append_dev(li14, a16);
    			append_dev(ul2, t33);
    			append_dev(ul2, li15);
    			append_dev(li15, a17);
    			append_dev(ul2, t34);
    			append_dev(ul2, li16);
    			append_dev(li16, a18);
    			append_dev(ul2, t35);
    			append_dev(ul2, li17);
    			append_dev(li17, a19);
    			append_dev(ul2, t36);
    			append_dev(ul2, li18);
    			append_dev(li18, a20);
    			append_dev(div11, t37);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, h1);
    			append_dev(h1, t38);
    			append_dev(h1, br);
    			append_dev(h1, t39);
    			append_dev(h1, span1);
    			append_dev(span1, t40);
    			append_dev(div9, t41);
    			append_dev(div9, div8);
    			append_dev(div8, p0);
    			append_dev(p0, t42);
    			append_dev(div8, t43);
    			append_dev(div8, a21);
    			append_dev(a21, t44);
    			append_dev(div8, t45);
    			append_dev(div8, p1);
    			append_dev(p1, t46);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div13);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\AboutUs.svelte generated by Svelte v3.29.7 */

    const file$1 = "src\\AboutUs.svelte";

    function create_fragment$1(ctx) {
    	let div20;
    	let div4;
    	let div3;
    	let div2;
    	let div0;
    	let h10;
    	let t0;
    	let t1;
    	let div1;
    	let p0;
    	let t2;
    	let t3;
    	let ul;
    	let li0;
    	let t4;
    	let t5;
    	let li1;
    	let t6;
    	let t7;
    	let li2;
    	let t8;
    	let t9;
    	let div9;
    	let div8;
    	let div7;
    	let div5;
    	let h11;
    	let t10;
    	let t11;
    	let div6;
    	let p1;
    	let t12;
    	let t13;
    	let div14;
    	let div13;
    	let div12;
    	let div10;
    	let h12;
    	let t14;
    	let t15;
    	let div11;
    	let p2;
    	let t16;
    	let t17;
    	let div19;
    	let div18;
    	let div17;
    	let div15;
    	let h13;
    	let t18;
    	let t19;
    	let div16;
    	let p3;
    	let t20;
    	let br0;
    	let t21;
    	let br1;
    	let t22;
    	let br2;
    	let t23;
    	let br3;
    	let t24;
    	let br4;
    	let t25;
    	let br5;
    	let t26;
    	let br6;
    	let t27;
    	let br7;
    	let t28;
    	let br8;

    	const block = {
    		c: function create() {
    			div20 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			t0 = text("О проекте");
    			t1 = space();
    			div1 = element("div");
    			p0 = element("p");
    			t2 = text("Корпоративный онлайн-университет – комплексное решение для управления системой обучения и развития персонала компании");
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			t4 = text("Обучение сотрудников всех должностных уровней");
    			t5 = space();
    			li1 = element("li");
    			t6 = text("Управление знаниями и формирование кадрового резерва");
    			t7 = space();
    			li2 = element("li");
    			t8 = text("Формирование единых ценностей для привлечения и удержания талантов");
    			t9 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			h11 = element("h1");
    			t10 = text("Цель проекта");
    			t11 = space();
    			div6 = element("div");
    			p1 = element("p");
    			t12 = text("Непрерывное обучение персонала для увеличения ценности сотрудников и формирования ресурса для достижения поставленных целей.\r\n                        Увеличение рентабельности обучения - за счет фиксированной стоимости и практически неограниченного доступа к более чем 30-ти бизнес-тематикам.\r\n                        Повышение статуса компании для привлечения высококвалифицированного персонала и дополнительных инвестиций");
    			t13 = space();
    			div14 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			div10 = element("div");
    			h12 = element("h1");
    			t14 = text("Кому интересен проект");
    			t15 = space();
    			div11 = element("div");
    			p2 = element("p");
    			t16 = text("Корпоративный онлайн университет ориентирован на компании, которые стремятся понять, \r\n                            какие тренды в технологиях и бизнес-моделях будут определять конкурентоспособность бизнеса. \r\n                            Проще говоря, выстраивают стратегию развития своей компании. Задача корпоративного университета – помощь в достижении этих целей!");
    			t17 = space();
    			div19 = element("div");
    			div18 = element("div");
    			div17 = element("div");
    			div15 = element("div");
    			h13 = element("h1");
    			t18 = text("Задачи, которые решает корпоративный университет");
    			t19 = space();
    			div16 = element("div");
    			p3 = element("p");
    			t20 = text("Развитие компетенций и управленческого потенциала ");
    			br0 = element("br");
    			t21 = text("\r\n                            Адаптация новых сотрудников и удержание ценных кадров ");
    			br1 = element("br");
    			t22 = text("\r\n                            Развитие корпоративной культуры и трансляция ценностей компании ");
    			br2 = element("br");
    			t23 = text("\r\n                             Работа над психологическим климатом, мотивация сотрудников ");
    			br3 = element("br");
    			t24 = text("\r\n                            Обучение и развитие сотрудников на постоянной основе ");
    			br4 = element("br");
    			t25 = text("\r\n                            Экономия бюджета на отдельно купленные программы ");
    			br5 = element("br");
    			t26 = text("\r\n                            Реализация основного функционала системы обучения ");
    			br6 = element("br");
    			t27 = text("\r\n                            Поддержание конкурентоспособности компании ");
    			br7 = element("br");
    			t28 = text("   \r\n                            Внутренняя аттестация персонала ");
    			br8 = element("br");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div20 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div20_nodes = children(div20);
    			div4 = claim_element(div20_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			div3 = claim_element(div4_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			div0 = claim_element(div2_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			h10 = claim_element(div0_nodes, "H1", { class: true });
    			var h10_nodes = children(h10);
    			t0 = claim_text(h10_nodes, "О проекте");
    			h10_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			t1 = claim_space(div2_nodes);
    			div1 = claim_element(div2_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			p0 = claim_element(div1_nodes, "P", { class: true });
    			var p0_nodes = children(p0);
    			t2 = claim_text(p0_nodes, "Корпоративный онлайн-университет – комплексное решение для управления системой обучения и развития персонала компании");
    			p0_nodes.forEach(detach_dev);
    			t3 = claim_space(div1_nodes);
    			ul = claim_element(div1_nodes, "UL", { class: true });
    			var ul_nodes = children(ul);
    			li0 = claim_element(ul_nodes, "LI", {});
    			var li0_nodes = children(li0);
    			t4 = claim_text(li0_nodes, "Обучение сотрудников всех должностных уровней");
    			li0_nodes.forEach(detach_dev);
    			t5 = claim_space(ul_nodes);
    			li1 = claim_element(ul_nodes, "LI", {});
    			var li1_nodes = children(li1);
    			t6 = claim_text(li1_nodes, "Управление знаниями и формирование кадрового резерва");
    			li1_nodes.forEach(detach_dev);
    			t7 = claim_space(ul_nodes);
    			li2 = claim_element(ul_nodes, "LI", {});
    			var li2_nodes = children(li2);
    			t8 = claim_text(li2_nodes, "Формирование единых ценностей для привлечения и удержания талантов");
    			li2_nodes.forEach(detach_dev);
    			ul_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			t9 = claim_space(div20_nodes);
    			div9 = claim_element(div20_nodes, "DIV", { class: true });
    			var div9_nodes = children(div9);
    			div8 = claim_element(div9_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);
    			div7 = claim_element(div8_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			div5 = claim_element(div7_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			h11 = claim_element(div5_nodes, "H1", { class: true });
    			var h11_nodes = children(h11);
    			t10 = claim_text(h11_nodes, "Цель проекта");
    			h11_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			t11 = claim_space(div7_nodes);
    			div6 = claim_element(div7_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			p1 = claim_element(div6_nodes, "P", { class: true });
    			var p1_nodes = children(p1);
    			t12 = claim_text(p1_nodes, "Непрерывное обучение персонала для увеличения ценности сотрудников и формирования ресурса для достижения поставленных целей.\r\n                        Увеличение рентабельности обучения - за счет фиксированной стоимости и практически неограниченного доступа к более чем 30-ти бизнес-тематикам.\r\n                        Повышение статуса компании для привлечения высококвалифицированного персонала и дополнительных инвестиций");
    			p1_nodes.forEach(detach_dev);
    			div6_nodes.forEach(detach_dev);
    			div7_nodes.forEach(detach_dev);
    			div8_nodes.forEach(detach_dev);
    			div9_nodes.forEach(detach_dev);
    			t13 = claim_space(div20_nodes);
    			div14 = claim_element(div20_nodes, "DIV", { class: true });
    			var div14_nodes = children(div14);
    			div13 = claim_element(div14_nodes, "DIV", { class: true });
    			var div13_nodes = children(div13);
    			div12 = claim_element(div13_nodes, "DIV", { class: true });
    			var div12_nodes = children(div12);
    			div10 = claim_element(div12_nodes, "DIV", { class: true });
    			var div10_nodes = children(div10);
    			h12 = claim_element(div10_nodes, "H1", { class: true });
    			var h12_nodes = children(h12);
    			t14 = claim_text(h12_nodes, "Кому интересен проект");
    			h12_nodes.forEach(detach_dev);
    			div10_nodes.forEach(detach_dev);
    			t15 = claim_space(div12_nodes);
    			div11 = claim_element(div12_nodes, "DIV", { class: true });
    			var div11_nodes = children(div11);
    			p2 = claim_element(div11_nodes, "P", { class: true });
    			var p2_nodes = children(p2);
    			t16 = claim_text(p2_nodes, "Корпоративный онлайн университет ориентирован на компании, которые стремятся понять, \r\n                            какие тренды в технологиях и бизнес-моделях будут определять конкурентоспособность бизнеса. \r\n                            Проще говоря, выстраивают стратегию развития своей компании. Задача корпоративного университета – помощь в достижении этих целей!");
    			p2_nodes.forEach(detach_dev);
    			div11_nodes.forEach(detach_dev);
    			div12_nodes.forEach(detach_dev);
    			div13_nodes.forEach(detach_dev);
    			div14_nodes.forEach(detach_dev);
    			t17 = claim_space(div20_nodes);
    			div19 = claim_element(div20_nodes, "DIV", { class: true });
    			var div19_nodes = children(div19);
    			div18 = claim_element(div19_nodes, "DIV", { class: true });
    			var div18_nodes = children(div18);
    			div17 = claim_element(div18_nodes, "DIV", { class: true });
    			var div17_nodes = children(div17);
    			div15 = claim_element(div17_nodes, "DIV", { class: true });
    			var div15_nodes = children(div15);
    			h13 = claim_element(div15_nodes, "H1", { class: true });
    			var h13_nodes = children(h13);
    			t18 = claim_text(h13_nodes, "Задачи, которые решает корпоративный университет");
    			h13_nodes.forEach(detach_dev);
    			div15_nodes.forEach(detach_dev);
    			t19 = claim_space(div17_nodes);
    			div16 = claim_element(div17_nodes, "DIV", { class: true });
    			var div16_nodes = children(div16);
    			p3 = claim_element(div16_nodes, "P", { class: true });
    			var p3_nodes = children(p3);
    			t20 = claim_text(p3_nodes, "Развитие компетенций и управленческого потенциала ");
    			br0 = claim_element(p3_nodes, "BR", {});
    			t21 = claim_text(p3_nodes, "\r\n                            Адаптация новых сотрудников и удержание ценных кадров ");
    			br1 = claim_element(p3_nodes, "BR", {});
    			t22 = claim_text(p3_nodes, "\r\n                            Развитие корпоративной культуры и трансляция ценностей компании ");
    			br2 = claim_element(p3_nodes, "BR", {});
    			t23 = claim_text(p3_nodes, "\r\n                             Работа над психологическим климатом, мотивация сотрудников ");
    			br3 = claim_element(p3_nodes, "BR", {});
    			t24 = claim_text(p3_nodes, "\r\n                            Обучение и развитие сотрудников на постоянной основе ");
    			br4 = claim_element(p3_nodes, "BR", {});
    			t25 = claim_text(p3_nodes, "\r\n                            Экономия бюджета на отдельно купленные программы ");
    			br5 = claim_element(p3_nodes, "BR", {});
    			t26 = claim_text(p3_nodes, "\r\n                            Реализация основного функционала системы обучения ");
    			br6 = claim_element(p3_nodes, "BR", {});
    			t27 = claim_text(p3_nodes, "\r\n                            Поддержание конкурентоспособности компании ");
    			br7 = claim_element(p3_nodes, "BR", {});
    			t28 = claim_text(p3_nodes, "   \r\n                            Внутренняя аттестация персонала ");
    			br8 = claim_element(p3_nodes, "BR", {});
    			p3_nodes.forEach(detach_dev);
    			div16_nodes.forEach(detach_dev);
    			div17_nodes.forEach(detach_dev);
    			div18_nodes.forEach(detach_dev);
    			div19_nodes.forEach(detach_dev);
    			div20_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h10, "class", "title__text svelte-1r5du3");
    			add_location(h10, file$1, 5, 24, 294);
    			attr_dev(div0, "class", "about__block__title");
    			add_location(div0, file$1, 4, 20, 235);
    			attr_dev(p0, "class", "description__text svelte-1r5du3");
    			add_location(p0, file$1, 11, 24, 549);
    			add_location(li0, file$1, 19, 28, 1067);
    			add_location(li1, file$1, 22, 28, 1215);
    			add_location(li2, file$1, 25, 28, 1370);
    			attr_dev(ul, "class", "description__text svelte-1r5du3");
    			add_location(ul, file$1, 18, 24, 1006);
    			attr_dev(div1, "class", "about__block_description ");
    			add_location(div1, file$1, 10, 20, 484);
    			attr_dev(div2, "class", "about__block about__block-1 container aboutUs svelte-1r5du3");
    			add_location(div2, file$1, 3, 16, 154);
    			attr_dev(div3, "class", "col-lg-10 col-xl-10");
    			add_location(div3, file$1, 2, 12, 103);
    			attr_dev(div4, "class", "row justify-content-start");
    			add_location(div4, file$1, 1, 8, 50);
    			attr_dev(h11, "class", "title__text end svelte-1r5du3");
    			add_location(h11, file$1, 37, 24, 1891);
    			attr_dev(div5, "class", "about__block__title");
    			add_location(div5, file$1, 36, 20, 1832);
    			attr_dev(p1, "class", "description__text svelte-1r5du3");
    			add_location(p1, file$1, 43, 24, 2156);
    			attr_dev(div6, "class", "about__block_description ");
    			add_location(div6, file$1, 42, 20, 2091);
    			attr_dev(div7, "class", "about__block about__block-2 container aboutUs svelte-1r5du3");
    			add_location(div7, file$1, 35, 16, 1751);
    			attr_dev(div8, "class", "col-lg-10 col-xl-10");
    			add_location(div8, file$1, 34, 12, 1700);
    			attr_dev(div9, "class", "row justify-content-end grey-color svelte-1r5du3");
    			add_location(div9, file$1, 33, 8, 1638);
    			attr_dev(h12, "class", "title__text animation svelte-1r5du3");
    			add_location(h12, file$1, 61, 24, 3399);
    			attr_dev(div10, "class", "about__block__title");
    			add_location(div10, file$1, 60, 20, 3340);
    			attr_dev(p2, "class", "description__text svelte-1r5du3");
    			add_location(p2, file$1, 67, 24, 3676);
    			attr_dev(div11, "class", "about__block_description");
    			add_location(div11, file$1, 66, 20, 3612);
    			attr_dev(div12, "class", "about__block about__block-1 about__animation-3 container aboutUs svelte-1r5du3");
    			add_location(div12, file$1, 59, 16, 3240);
    			attr_dev(div13, "class", "col-lg-10 col-xl-10");
    			add_location(div13, file$1, 58, 12, 3189);
    			attr_dev(div14, "class", "row justify-content-start");
    			add_location(div14, file$1, 57, 8, 3136);
    			attr_dev(h13, "class", "title__text end svelte-1r5du3");
    			add_location(h13, file$1, 82, 24, 4671);
    			attr_dev(div15, "class", "about__block__title");
    			add_location(div15, file$1, 81, 20, 4612);
    			add_location(br0, file$1, 100, 78, 6190);
    			add_location(br1, file$1, 101, 82, 6278);
    			add_location(br2, file$1, 102, 92, 6376);
    			add_location(br3, file$1, 103, 88, 6470);
    			add_location(br4, file$1, 104, 81, 6557);
    			add_location(br5, file$1, 105, 77, 6640);
    			add_location(br6, file$1, 106, 78, 6724);
    			add_location(br7, file$1, 107, 71, 6801);
    			add_location(br8, file$1, 108, 60, 6870);
    			attr_dev(p3, "class", "description__text svelte-1r5du3");
    			add_location(p3, file$1, 88, 24, 4967);
    			attr_dev(div16, "class", "about__block_description");
    			add_location(div16, file$1, 87, 20, 4903);
    			attr_dev(div17, "class", "about__block about__block-4 container aboutUs svelte-1r5du3");
    			add_location(div17, file$1, 80, 16, 4531);
    			attr_dev(div18, "class", "col-lg-10 col-xl-10");
    			add_location(div18, file$1, 79, 12, 4480);
    			attr_dev(div19, "class", "row justify-content-end grey-color svelte-1r5du3");
    			add_location(div19, file$1, 78, 8, 4418);
    			attr_dev(div20, "class", "container");
    			attr_dev(div20, "id", "about_Us");
    			add_location(div20, file$1, 0, 3, 3);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div20, anchor);
    			append_dev(div20, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h10);
    			append_dev(h10, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(li0, t4);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(li1, t6);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(li2, t8);
    			append_dev(div20, t9);
    			append_dev(div20, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, h11);
    			append_dev(h11, t10);
    			append_dev(div7, t11);
    			append_dev(div7, div6);
    			append_dev(div6, p1);
    			append_dev(p1, t12);
    			append_dev(div20, t13);
    			append_dev(div20, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div10);
    			append_dev(div10, h12);
    			append_dev(h12, t14);
    			append_dev(div12, t15);
    			append_dev(div12, div11);
    			append_dev(div11, p2);
    			append_dev(p2, t16);
    			append_dev(div20, t17);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, div17);
    			append_dev(div17, div15);
    			append_dev(div15, h13);
    			append_dev(h13, t18);
    			append_dev(div17, t19);
    			append_dev(div17, div16);
    			append_dev(div16, p3);
    			append_dev(p3, t20);
    			append_dev(p3, br0);
    			append_dev(p3, t21);
    			append_dev(p3, br1);
    			append_dev(p3, t22);
    			append_dev(p3, br2);
    			append_dev(p3, t23);
    			append_dev(p3, br3);
    			append_dev(p3, t24);
    			append_dev(p3, br4);
    			append_dev(p3, t25);
    			append_dev(p3, br5);
    			append_dev(p3, t26);
    			append_dev(p3, br6);
    			append_dev(p3, t27);
    			append_dev(p3, br7);
    			append_dev(p3, t28);
    			append_dev(p3, br8);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div20);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AboutUs", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AboutUs> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class AboutUs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AboutUs",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\YouCan.svelte generated by Svelte v3.29.7 */

    const file$2 = "src\\YouCan.svelte";

    function create_fragment$2(ctx) {
    	let div5;
    	let h2;
    	let t0;
    	let t1;
    	let div4;
    	let div3;
    	let div0;
    	let p0;
    	let t2;
    	let br0;
    	let t3;
    	let br1;
    	let t4;
    	let t5;
    	let div1;
    	let p1;
    	let t6;
    	let br2;
    	let t7;
    	let t8;
    	let div2;
    	let p2;
    	let t9;
    	let br3;
    	let t10;
    	let br4;
    	let t11;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			h2 = element("h2");
    			t0 = text("Вы сможете");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t2 = text("Не тратить время на поиск ");
    			br0 = element("br");
    			t3 = text(" провайдера образовательных ");
    			br1 = element("br");
    			t4 = text(" услуг");
    			t5 = space();
    			div1 = element("div");
    			p1 = element("p");
    			t6 = text("Обеспечить непрерывное обучение\r\n                и развитие персонала ");
    			br2 = element("br");
    			t7 = text(" самостоятельно составив график");
    			t8 = space();
    			div2 = element("div");
    			p2 = element("p");
    			t9 = text("Всегда получать актуальные ");
    			br3 = element("br");
    			t10 = text(" знания, которые применяют ");
    			br4 = element("br");
    			t11 = text("  в своей работе более 300 экспертов");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div5 = claim_element(nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			h2 = claim_element(div5_nodes, "H2", { class: true });
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, "Вы сможете");
    			h2_nodes.forEach(detach_dev);
    			t1 = claim_space(div5_nodes);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			div3 = claim_element(div4_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div0 = claim_element(div3_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			p0 = claim_element(div0_nodes, "P", { class: true });
    			var p0_nodes = children(p0);
    			t2 = claim_text(p0_nodes, "Не тратить время на поиск ");
    			br0 = claim_element(p0_nodes, "BR", {});
    			t3 = claim_text(p0_nodes, " провайдера образовательных ");
    			br1 = claim_element(p0_nodes, "BR", {});
    			t4 = claim_text(p0_nodes, " услуг");
    			p0_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			t5 = claim_space(div3_nodes);
    			div1 = claim_element(div3_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			p1 = claim_element(div1_nodes, "P", { class: true });
    			var p1_nodes = children(p1);
    			t6 = claim_text(p1_nodes, "Обеспечить непрерывное обучение\r\n                и развитие персонала ");
    			br2 = claim_element(p1_nodes, "BR", {});
    			t7 = claim_text(p1_nodes, " самостоятельно составив график");
    			p1_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			t8 = claim_space(div3_nodes);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			p2 = claim_element(div2_nodes, "P", { class: true });
    			var p2_nodes = children(p2);
    			t9 = claim_text(p2_nodes, "Всегда получать актуальные ");
    			br3 = claim_element(p2_nodes, "BR", {});
    			t10 = claim_text(p2_nodes, " знания, которые применяют ");
    			br4 = claim_element(p2_nodes, "BR", {});
    			t11 = claim_text(p2_nodes, "  в своей работе более 300 экспертов");
    			p2_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h2, "class", "svelte-h516af");
    			add_location(h2, file$2, 1, 4, 42);
    			add_location(br0, file$2, 7, 42, 255);
    			add_location(br1, file$2, 7, 74, 287);
    			attr_dev(p0, "class", "svelte-h516af");
    			add_location(p0, file$2, 6, 12, 208);
    			attr_dev(div0, "class", "col-lg-4 col-md-12 col-sm-12 first__block youCan__block svelte-h516af");
    			add_location(div0, file$2, 5, 8, 125);
    			add_location(br2, file$2, 13, 37, 516);
    			attr_dev(p1, "class", "svelte-h516af");
    			add_location(p1, file$2, 11, 12, 425);
    			attr_dev(div1, "class", "col-lg-4 col-md-12 col-sm-12 second__block youCan__block svelte-h516af");
    			add_location(div1, file$2, 10, 8, 341);
    			add_location(br3, file$2, 18, 43, 727);
    			add_location(br4, file$2, 18, 74, 758);
    			attr_dev(p2, "class", "svelte-h516af");
    			add_location(p2, file$2, 17, 12, 679);
    			attr_dev(div2, "class", "col-lg-4 col-md-12 col-sm-12 thirty__block youCan__block svelte-h516af");
    			add_location(div2, file$2, 16, 8, 595);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$2, 4, 4, 98);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$2, 2, 4, 67);
    			attr_dev(div5, "class", "container youCan__main svelte-h516af");
    			add_location(div5, file$2, 0, 0, 0);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, h2);
    			append_dev(h2, t0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t2);
    			append_dev(p0, br0);
    			append_dev(p0, t3);
    			append_dev(p0, br1);
    			append_dev(p0, t4);
    			append_dev(div3, t5);
    			append_dev(div3, div1);
    			append_dev(div1, p1);
    			append_dev(p1, t6);
    			append_dev(p1, br2);
    			append_dev(p1, t7);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, p2);
    			append_dev(p2, t9);
    			append_dev(p2, br3);
    			append_dev(p2, t10);
    			append_dev(p2, br4);
    			append_dev(p2, t11);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("YouCan", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<YouCan> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class YouCan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "YouCan",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\FeedbackForm.svelte generated by Svelte v3.29.7 */

    const file$3 = "src\\FeedbackForm.svelte";

    function create_fragment$3(ctx) {
    	let div9;
    	let div8;
    	let div7;
    	let div1;
    	let div0;
    	let p;
    	let t0;
    	let t1;
    	let div6;
    	let form;
    	let div5;
    	let div4;
    	let div2;
    	let input0;
    	let t2;
    	let div3;
    	let input1;
    	let t3;
    	let input2;
    	let t4;
    	let label;
    	let input3;
    	let t5;
    	let span0;
    	let t6;
    	let span1;
    	let t7;
    	let a;
    	let t8;
    	let t9;
    	let button;
    	let t10;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text("Всегда важно понять, кто ведёт обучение и как проходят занятия - с радостью пришлём\r\n                        вам один из модулей");
    			t1 = space();
    			div6 = element("div");
    			form = element("form");
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div3 = element("div");
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			label = element("label");
    			input3 = element("input");
    			t5 = space();
    			span0 = element("span");
    			t6 = space();
    			span1 = element("span");
    			t7 = text("Я согласен с ");
    			a = element("a");
    			t8 = text("политикой\r\n                                    конфиденциальности");
    			t9 = space();
    			button = element("button");
    			t10 = text("Отправить");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div9 = claim_element(nodes, "DIV", { class: true });
    			var div9_nodes = children(div9);
    			div8 = claim_element(div9_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);
    			div7 = claim_element(div8_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			div1 = claim_element(div7_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			p = claim_element(div0_nodes, "P", { class: true });
    			var p_nodes = children(p);
    			t0 = claim_text(p_nodes, "Всегда важно понять, кто ведёт обучение и как проходят занятия - с радостью пришлём\r\n                        вам один из модулей");
    			p_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			t1 = claim_space(div7_nodes);
    			div6 = claim_element(div7_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			form = claim_element(div6_nodes, "FORM", { action: true, method: true, class: true });
    			var form_nodes = children(form);
    			div5 = claim_element(form_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			div2 = claim_element(div4_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);

    			input0 = claim_element(div2_nodes, "INPUT", {
    				type: true,
    				name: true,
    				class: true,
    				placeholder: true,
    				required: true
    			});

    			div2_nodes.forEach(detach_dev);
    			t2 = claim_space(div4_nodes);
    			div3 = claim_element(div4_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);

    			input1 = claim_element(div3_nodes, "INPUT", {
    				name: true,
    				id: true,
    				class: true,
    				placeholder: true,
    				required: true
    			});

    			div3_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			t3 = claim_space(div5_nodes);

    			input2 = claim_element(div5_nodes, "INPUT", {
    				type: true,
    				name: true,
    				class: true,
    				placeholder: true,
    				required: true
    			});

    			t4 = claim_space(div5_nodes);
    			label = claim_element(div5_nodes, "LABEL", { class: true });
    			var label_nodes = children(label);
    			input3 = claim_element(label_nodes, "INPUT", { type: true, class: true });
    			t5 = claim_space(label_nodes);
    			span0 = claim_element(label_nodes, "SPAN", { class: true });
    			children(span0).forEach(detach_dev);
    			t6 = claim_space(label_nodes);
    			span1 = claim_element(label_nodes, "SPAN", { class: true });
    			var span1_nodes = children(span1);
    			t7 = claim_text(span1_nodes, "Я согласен с ");
    			a = claim_element(span1_nodes, "A", { href: true, target: true, class: true });
    			var a_nodes = children(a);
    			t8 = claim_text(a_nodes, "политикой\r\n                                    конфиденциальности");
    			a_nodes.forEach(detach_dev);
    			span1_nodes.forEach(detach_dev);
    			label_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			t9 = claim_space(form_nodes);
    			button = claim_element(form_nodes, "BUTTON", { class: true, disabled: true, type: true });
    			var button_nodes = children(button);
    			t10 = claim_text(button_nodes, "Отправить");
    			button_nodes.forEach(detach_dev);
    			form_nodes.forEach(detach_dev);
    			div6_nodes.forEach(detach_dev);
    			div7_nodes.forEach(detach_dev);
    			div8_nodes.forEach(detach_dev);
    			div9_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(p, "class", "text-block_content svelte-15kys1u");
    			add_location(p, file$3, 9, 20, 241);
    			attr_dev(div0, "class", "text-block svelte-15kys1u");
    			add_location(div0, file$3, 8, 16, 195);
    			attr_dev(div1, "class", "col-xl-7");
    			add_location(div1, file$3, 7, 12, 155);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "name");
    			attr_dev(input0, "class", "form-control form__name svelte-15kys1u");
    			attr_dev(input0, "placeholder", "Ваше имя");
    			input0.required = true;
    			add_location(input0, file$3, 20, 32, 808);
    			attr_dev(div2, "class", "col-xl-6");
    			add_location(div2, file$3, 19, 28, 752);
    			attr_dev(input1, "name", "phone");
    			attr_dev(input1, "id", "tel");
    			attr_dev(input1, "class", "form-control form__send__number svelte-15kys1u");
    			attr_dev(input1, "placeholder", "Ваш телефон");
    			input1.required = true;
    			add_location(input1, file$3, 23, 32, 1025);
    			attr_dev(div3, "class", "col-xl-6");
    			add_location(div3, file$3, 22, 28, 969);
    			attr_dev(div4, "class", "row align-items-center");
    			add_location(div4, file$3, 18, 24, 686);
    			attr_dev(input2, "type", "email");
    			attr_dev(input2, "name", "email");
    			attr_dev(input2, "class", "form-control  form_send__email svelte-15kys1u");
    			attr_dev(input2, "placeholder", "Ваш электронный адрес");
    			input2.required = true;
    			add_location(input2, file$3, 27, 24, 1260);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "class", "checkbox svelte-15kys1u");
    			add_location(input3, file$3, 30, 28, 1483);
    			attr_dev(span0, "class", "fake svelte-15kys1u");
    			add_location(span0, file$3, 31, 28, 1572);
    			attr_dev(a, "href", "/img/politika_peda.pdf");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "link svelte-15kys1u");
    			add_location(a, file$3, 32, 57, 1657);
    			attr_dev(span1, "class", "p svelte-15kys1u");
    			add_location(span1, file$3, 32, 28, 1628);
    			attr_dev(label, "class", "label svelte-15kys1u");
    			add_location(label, file$3, 29, 24, 1432);
    			attr_dev(div5, "class", "form-block");
    			add_location(div5, file$3, 17, 20, 636);
    			attr_dev(button, "class", "form__btn svelte-15kys1u");
    			button.disabled = button_disabled_value = !/*yes*/ ctx[0];
    			attr_dev(button, "type", "submit");
    			add_location(button, file$3, 36, 20, 1880);
    			attr_dev(form, "action", "send.php");
    			attr_dev(form, "method", "POST");
    			attr_dev(form, "class", "form__send__module");
    			add_location(form, file$3, 16, 16, 549);
    			attr_dev(div6, "class", "col-xl-5");
    			add_location(div6, file$3, 15, 12, 509);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$3, 6, 8, 124);
    			attr_dev(div8, "class", "container");
    			add_location(div8, file$3, 5, 4, 91);
    			attr_dev(div9, "class", "form-container first__form svelte-15kys1u");
    			add_location(div9, file$3, 4, 0, 45);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div7, t1);
    			append_dev(div7, div6);
    			append_dev(div6, form);
    			append_dev(form, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, input0);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, input1);
    			append_dev(div5, t3);
    			append_dev(div5, input2);
    			append_dev(div5, t4);
    			append_dev(div5, label);
    			append_dev(label, input3);
    			input3.checked = /*yes*/ ctx[0];
    			append_dev(label, t5);
    			append_dev(label, span0);
    			append_dev(label, t6);
    			append_dev(label, span1);
    			append_dev(span1, t7);
    			append_dev(span1, a);
    			append_dev(a, t8);
    			append_dev(form, t9);
    			append_dev(form, button);
    			append_dev(button, t10);

    			if (!mounted) {
    				dispose = listen_dev(input3, "change", /*input3_change_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*yes*/ 1) {
    				input3.checked = /*yes*/ ctx[0];
    			}

    			if (dirty & /*yes*/ 1 && button_disabled_value !== (button_disabled_value = !/*yes*/ ctx[0])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FeedbackForm", slots, []);
    	let yes = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FeedbackForm> was created with unknown prop '${key}'`);
    	});

    	function input3_change_handler() {
    		yes = this.checked;
    		$$invalidate(0, yes);
    	}

    	$$self.$capture_state = () => ({ yes });

    	$$self.$inject_state = $$props => {
    		if ("yes" in $$props) $$invalidate(0, yes = $$props.yes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [yes, input3_change_handler];
    }

    class FeedbackForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FeedbackForm",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Slider.svelte generated by Svelte v3.29.7 */

    const file$4 = "src\\Slider.svelte";

    function create_fragment$4(ctx) {
    	let div30;
    	let div29;
    	let div21;
    	let div20;
    	let h1;
    	let t0;
    	let t1;
    	let div19;
    	let ol;
    	let li0;
    	let t2;
    	let li1;
    	let t3;
    	let li2;
    	let t4;
    	let li3;
    	let t5;
    	let li4;
    	let t6;
    	let li5;
    	let t7;
    	let li6;
    	let t8;
    	let li7;
    	let t9;
    	let li8;
    	let t10;
    	let div18;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t11;
    	let div0;
    	let p0;
    	let t12;
    	let t13;
    	let div3;
    	let img1;
    	let img1_src_value;
    	let t14;
    	let div2;
    	let p1;
    	let t15;
    	let t16;
    	let div5;
    	let img2;
    	let img2_src_value;
    	let t17;
    	let div4;
    	let p2;
    	let t18;
    	let t19;
    	let div7;
    	let img3;
    	let img3_src_value;
    	let t20;
    	let div6;
    	let p3;
    	let t21;
    	let t22;
    	let div9;
    	let img4;
    	let img4_src_value;
    	let t23;
    	let div8;
    	let p4;
    	let t24;
    	let t25;
    	let div11;
    	let img5;
    	let img5_src_value;
    	let t26;
    	let div10;
    	let p5;
    	let t27;
    	let t28;
    	let div13;
    	let img6;
    	let img6_src_value;
    	let t29;
    	let div12;
    	let p6;
    	let t30;
    	let t31;
    	let div15;
    	let img7;
    	let img7_src_value;
    	let t32;
    	let div14;
    	let p7;
    	let t33;
    	let t34;
    	let div17;
    	let img8;
    	let img8_src_value;
    	let t35;
    	let div16;
    	let p8;
    	let t36;
    	let t37;
    	let a0;
    	let span0;
    	let t38;
    	let span1;
    	let t39;
    	let a1;
    	let span2;
    	let t40;
    	let span3;
    	let t41;
    	let div22;
    	let t42;
    	let div28;
    	let div27;
    	let div24;
    	let div23;
    	let p9;
    	let t43;
    	let t44;
    	let div26;
    	let div25;
    	let button;
    	let t45;

    	const block = {
    		c: function create() {
    			div30 = element("div");
    			div29 = element("div");
    			div21 = element("div");
    			div20 = element("div");
    			h1 = element("h1");
    			t0 = text("Как подключиться");
    			t1 = space();
    			div19 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			t2 = space();
    			li1 = element("li");
    			t3 = space();
    			li2 = element("li");
    			t4 = space();
    			li3 = element("li");
    			t5 = space();
    			li4 = element("li");
    			t6 = space();
    			li5 = element("li");
    			t7 = space();
    			li6 = element("li");
    			t8 = space();
    			li7 = element("li");
    			t9 = space();
    			li8 = element("li");
    			t10 = space();
    			div18 = element("div");
    			div1 = element("div");
    			img0 = element("img");
    			t11 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t12 = text("Шаг 1. Направьте заявку и наш консультант свяжется с вами");
    			t13 = space();
    			div3 = element("div");
    			img1 = element("img");
    			t14 = space();
    			div2 = element("div");
    			p1 = element("p");
    			t15 = text("Шаг 2. Подберем тариф и подпишем договор.");
    			t16 = space();
    			div5 = element("div");
    			img2 = element("img");
    			t17 = space();
    			div4 = element("div");
    			p2 = element("p");
    			t18 = text("Шаг 3. После оплаты, вы получите доступ в личный кабинет");
    			t19 = space();
    			div7 = element("div");
    			img3 = element("img");
    			t20 = space();
    			div6 = element("div");
    			p3 = element("p");
    			t21 = text("Шаг 4.Авторизуйтесь — и перед вами расписание занятий.");
    			t22 = space();
    			div9 = element("div");
    			img4 = element("img");
    			t23 = space();
    			div8 = element("div");
    			p4 = element("p");
    			t24 = text("Шаг 5. Авторизуйтесь — и перед вами расписание занятий.");
    			t25 = space();
    			div11 = element("div");
    			img5 = element("img");
    			t26 = space();
    			div10 = element("div");
    			p5 = element("p");
    			t27 = text("Шаг 6. Выберите тему и зарегистрируйте участника.");
    			t28 = space();
    			div13 = element("div");
    			img6 = element("img");
    			t29 = space();
    			div12 = element("div");
    			p6 = element("p");
    			t30 = text("Шаг 7. Участники получают ссылку на онлайн трансляцию и уведомление о старте курса.");
    			t31 = space();
    			div15 = element("div");
    			img7 = element("img");
    			t32 = space();
    			div14 = element("div");
    			p7 = element("p");
    			t33 = text("Шаг 8. В день занятий нужно просто пройти по ссылке.");
    			t34 = space();
    			div17 = element("div");
    			img8 = element("img");
    			t35 = space();
    			div16 = element("div");
    			p8 = element("p");
    			t36 = text("Шаг 9. Все! Полезного обучения!");
    			t37 = space();
    			a0 = element("a");
    			span0 = element("span");
    			t38 = space();
    			span1 = element("span");
    			t39 = space();
    			a1 = element("a");
    			span2 = element("span");
    			t40 = space();
    			span3 = element("span");
    			t41 = space();
    			div22 = element("div");
    			t42 = space();
    			div28 = element("div");
    			div27 = element("div");
    			div24 = element("div");
    			div23 = element("div");
    			p9 = element("p");
    			t43 = text("Получите временный доступ к личному кабинету, чтобы ознакомиться со всеми\r\n                                    тонкостями процесса обучения, образовательными программами и внутренним\r\n                                    устройством нашего онлайн-университета");
    			t44 = space();
    			div26 = element("div");
    			div25 = element("div");
    			button = element("button");
    			t45 = text("Получить");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div30 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div30_nodes = children(div30);
    			div29 = claim_element(div30_nodes, "DIV", { class: true });
    			var div29_nodes = children(div29);
    			div21 = claim_element(div29_nodes, "DIV", { class: true });
    			var div21_nodes = children(div21);
    			div20 = claim_element(div21_nodes, "DIV", { class: true });
    			var div20_nodes = children(div20);
    			h1 = claim_element(div20_nodes, "H1", { class: true });
    			var h1_nodes = children(h1);
    			t0 = claim_text(h1_nodes, "Как подключиться");
    			h1_nodes.forEach(detach_dev);
    			t1 = claim_space(div20_nodes);
    			div19 = claim_element(div20_nodes, "DIV", { id: true, class: true, "data-ride": true });
    			var div19_nodes = children(div19);
    			ol = claim_element(div19_nodes, "OL", { class: true });
    			var ol_nodes = children(ol);

    			li0 = claim_element(ol_nodes, "LI", {
    				"data-target": true,
    				"data-slide-to": true,
    				class: true
    			});

    			children(li0).forEach(detach_dev);
    			t2 = claim_space(ol_nodes);

    			li1 = claim_element(ol_nodes, "LI", {
    				"data-target": true,
    				"data-slide-to": true
    			});

    			children(li1).forEach(detach_dev);
    			t3 = claim_space(ol_nodes);

    			li2 = claim_element(ol_nodes, "LI", {
    				"data-target": true,
    				"data-slide-to": true
    			});

    			children(li2).forEach(detach_dev);
    			t4 = claim_space(ol_nodes);

    			li3 = claim_element(ol_nodes, "LI", {
    				"data-target": true,
    				"data-slide-to": true
    			});

    			children(li3).forEach(detach_dev);
    			t5 = claim_space(ol_nodes);

    			li4 = claim_element(ol_nodes, "LI", {
    				"data-target": true,
    				"data-slide-to": true
    			});

    			children(li4).forEach(detach_dev);
    			t6 = claim_space(ol_nodes);

    			li5 = claim_element(ol_nodes, "LI", {
    				"data-target": true,
    				"data-slide-to": true
    			});

    			children(li5).forEach(detach_dev);
    			t7 = claim_space(ol_nodes);

    			li6 = claim_element(ol_nodes, "LI", {
    				"data-target": true,
    				"data-slide-to": true
    			});

    			children(li6).forEach(detach_dev);
    			t8 = claim_space(ol_nodes);

    			li7 = claim_element(ol_nodes, "LI", {
    				"data-target": true,
    				"data-slide-to": true
    			});

    			children(li7).forEach(detach_dev);
    			t9 = claim_space(ol_nodes);

    			li8 = claim_element(ol_nodes, "LI", {
    				"data-target": true,
    				"data-slide-to": true
    			});

    			children(li8).forEach(detach_dev);
    			ol_nodes.forEach(detach_dev);
    			t10 = claim_space(div19_nodes);
    			div18 = claim_element(div19_nodes, "DIV", { class: true });
    			var div18_nodes = children(div18);
    			div1 = claim_element(div18_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			img0 = claim_element(div1_nodes, "IMG", { src: true, class: true, alt: true });
    			t11 = claim_space(div1_nodes);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			p0 = claim_element(div0_nodes, "P", { class: true });
    			var p0_nodes = children(p0);
    			t12 = claim_text(p0_nodes, "Шаг 1. Направьте заявку и наш консультант свяжется с вами");
    			p0_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			t13 = claim_space(div18_nodes);
    			div3 = claim_element(div18_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			img1 = claim_element(div3_nodes, "IMG", { src: true, class: true, alt: true });
    			t14 = claim_space(div3_nodes);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			p1 = claim_element(div2_nodes, "P", { class: true });
    			var p1_nodes = children(p1);
    			t15 = claim_text(p1_nodes, "Шаг 2. Подберем тариф и подпишем договор.");
    			p1_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			t16 = claim_space(div18_nodes);
    			div5 = claim_element(div18_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			img2 = claim_element(div5_nodes, "IMG", { src: true, class: true, alt: true });
    			t17 = claim_space(div5_nodes);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			p2 = claim_element(div4_nodes, "P", { class: true });
    			var p2_nodes = children(p2);
    			t18 = claim_text(p2_nodes, "Шаг 3. После оплаты, вы получите доступ в личный кабинет");
    			p2_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			t19 = claim_space(div18_nodes);
    			div7 = claim_element(div18_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			img3 = claim_element(div7_nodes, "IMG", { src: true, class: true, alt: true });
    			t20 = claim_space(div7_nodes);
    			div6 = claim_element(div7_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			p3 = claim_element(div6_nodes, "P", { class: true });
    			var p3_nodes = children(p3);
    			t21 = claim_text(p3_nodes, "Шаг 4.Авторизуйтесь — и перед вами расписание занятий.");
    			p3_nodes.forEach(detach_dev);
    			div6_nodes.forEach(detach_dev);
    			div7_nodes.forEach(detach_dev);
    			t22 = claim_space(div18_nodes);
    			div9 = claim_element(div18_nodes, "DIV", { class: true });
    			var div9_nodes = children(div9);
    			img4 = claim_element(div9_nodes, "IMG", { src: true, class: true, alt: true });
    			t23 = claim_space(div9_nodes);
    			div8 = claim_element(div9_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);
    			p4 = claim_element(div8_nodes, "P", { class: true });
    			var p4_nodes = children(p4);
    			t24 = claim_text(p4_nodes, "Шаг 5. Авторизуйтесь — и перед вами расписание занятий.");
    			p4_nodes.forEach(detach_dev);
    			div8_nodes.forEach(detach_dev);
    			div9_nodes.forEach(detach_dev);
    			t25 = claim_space(div18_nodes);
    			div11 = claim_element(div18_nodes, "DIV", { class: true });
    			var div11_nodes = children(div11);
    			img5 = claim_element(div11_nodes, "IMG", { src: true, class: true, alt: true });
    			t26 = claim_space(div11_nodes);
    			div10 = claim_element(div11_nodes, "DIV", { class: true });
    			var div10_nodes = children(div10);
    			p5 = claim_element(div10_nodes, "P", { class: true });
    			var p5_nodes = children(p5);
    			t27 = claim_text(p5_nodes, "Шаг 6. Выберите тему и зарегистрируйте участника.");
    			p5_nodes.forEach(detach_dev);
    			div10_nodes.forEach(detach_dev);
    			div11_nodes.forEach(detach_dev);
    			t28 = claim_space(div18_nodes);
    			div13 = claim_element(div18_nodes, "DIV", { class: true });
    			var div13_nodes = children(div13);
    			img6 = claim_element(div13_nodes, "IMG", { src: true, class: true, alt: true });
    			t29 = claim_space(div13_nodes);
    			div12 = claim_element(div13_nodes, "DIV", { class: true });
    			var div12_nodes = children(div12);
    			p6 = claim_element(div12_nodes, "P", { class: true });
    			var p6_nodes = children(p6);
    			t30 = claim_text(p6_nodes, "Шаг 7. Участники получают ссылку на онлайн трансляцию и уведомление о старте курса.");
    			p6_nodes.forEach(detach_dev);
    			div12_nodes.forEach(detach_dev);
    			div13_nodes.forEach(detach_dev);
    			t31 = claim_space(div18_nodes);
    			div15 = claim_element(div18_nodes, "DIV", { class: true });
    			var div15_nodes = children(div15);
    			img7 = claim_element(div15_nodes, "IMG", { src: true, class: true, alt: true });
    			t32 = claim_space(div15_nodes);
    			div14 = claim_element(div15_nodes, "DIV", { class: true });
    			var div14_nodes = children(div14);
    			p7 = claim_element(div14_nodes, "P", { class: true });
    			var p7_nodes = children(p7);
    			t33 = claim_text(p7_nodes, "Шаг 8. В день занятий нужно просто пройти по ссылке.");
    			p7_nodes.forEach(detach_dev);
    			div14_nodes.forEach(detach_dev);
    			div15_nodes.forEach(detach_dev);
    			t34 = claim_space(div18_nodes);
    			div17 = claim_element(div18_nodes, "DIV", { class: true });
    			var div17_nodes = children(div17);
    			img8 = claim_element(div17_nodes, "IMG", { src: true, class: true, alt: true });
    			t35 = claim_space(div17_nodes);
    			div16 = claim_element(div17_nodes, "DIV", { class: true });
    			var div16_nodes = children(div16);
    			p8 = claim_element(div16_nodes, "P", { class: true });
    			var p8_nodes = children(p8);
    			t36 = claim_text(p8_nodes, "Шаг 9. Все! Полезного обучения!");
    			p8_nodes.forEach(detach_dev);
    			div16_nodes.forEach(detach_dev);
    			div17_nodes.forEach(detach_dev);
    			div18_nodes.forEach(detach_dev);
    			t37 = claim_space(div19_nodes);

    			a0 = claim_element(div19_nodes, "A", {
    				class: true,
    				href: true,
    				role: true,
    				"data-slide": true
    			});

    			var a0_nodes = children(a0);
    			span0 = claim_element(a0_nodes, "SPAN", { class: true, "aria-hidden": true });
    			children(span0).forEach(detach_dev);
    			t38 = claim_space(a0_nodes);
    			span1 = claim_element(a0_nodes, "SPAN", { class: true });
    			children(span1).forEach(detach_dev);
    			a0_nodes.forEach(detach_dev);
    			t39 = claim_space(div19_nodes);

    			a1 = claim_element(div19_nodes, "A", {
    				class: true,
    				href: true,
    				role: true,
    				"data-slide": true
    			});

    			var a1_nodes = children(a1);
    			span2 = claim_element(a1_nodes, "SPAN", { class: true, "aria-hidden": true });
    			children(span2).forEach(detach_dev);
    			t40 = claim_space(a1_nodes);
    			span3 = claim_element(a1_nodes, "SPAN", { class: true });
    			children(span3).forEach(detach_dev);
    			a1_nodes.forEach(detach_dev);
    			div19_nodes.forEach(detach_dev);
    			div20_nodes.forEach(detach_dev);
    			div21_nodes.forEach(detach_dev);
    			t41 = claim_space(div29_nodes);
    			div22 = claim_element(div29_nodes, "DIV", { class: true });
    			var div22_nodes = children(div22);
    			div22_nodes.forEach(detach_dev);
    			t42 = claim_space(div29_nodes);
    			div28 = claim_element(div29_nodes, "DIV", { class: true });
    			var div28_nodes = children(div28);
    			div27 = claim_element(div28_nodes, "DIV", { class: true });
    			var div27_nodes = children(div27);
    			div24 = claim_element(div27_nodes, "DIV", { class: true });
    			var div24_nodes = children(div24);
    			div23 = claim_element(div24_nodes, "DIV", { class: true });
    			var div23_nodes = children(div23);
    			p9 = claim_element(div23_nodes, "P", { class: true });
    			var p9_nodes = children(p9);
    			t43 = claim_text(p9_nodes, "Получите временный доступ к личному кабинету, чтобы ознакомиться со всеми\r\n                                    тонкостями процесса обучения, образовательными программами и внутренним\r\n                                    устройством нашего онлайн-университета");
    			p9_nodes.forEach(detach_dev);
    			div23_nodes.forEach(detach_dev);
    			div24_nodes.forEach(detach_dev);
    			t44 = claim_space(div27_nodes);
    			div26 = claim_element(div27_nodes, "DIV", { class: true });
    			var div26_nodes = children(div26);
    			div25 = claim_element(div26_nodes, "DIV", { class: true });
    			var div25_nodes = children(div25);

    			button = claim_element(div25_nodes, "BUTTON", {
    				class: true,
    				"data-toggle": true,
    				"data-target": true
    			});

    			var button_nodes = children(button);
    			t45 = claim_text(button_nodes, "Получить");
    			button_nodes.forEach(detach_dev);
    			div25_nodes.forEach(detach_dev);
    			div26_nodes.forEach(detach_dev);
    			div27_nodes.forEach(detach_dev);
    			div28_nodes.forEach(detach_dev);
    			div29_nodes.forEach(detach_dev);
    			div30_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h1, "class", "title svelte-1201qmz");
    			add_location(h1, file$4, 5, 24, 249);
    			attr_dev(li0, "data-target", "#carouselExampleCaptions");
    			attr_dev(li0, "data-slide-to", "0");
    			attr_dev(li0, "class", "active");
    			add_location(li0, file$4, 8, 30, 494);
    			attr_dev(li1, "data-target", "#carouselExampleCaptions");
    			attr_dev(li1, "data-slide-to", "1");
    			add_location(li1, file$4, 9, 30, 607);
    			attr_dev(li2, "data-target", "#carouselExampleCaptions");
    			attr_dev(li2, "data-slide-to", "2");
    			add_location(li2, file$4, 10, 30, 705);
    			attr_dev(li3, "data-target", "#carouselExampleCaptions");
    			attr_dev(li3, "data-slide-to", "3");
    			add_location(li3, file$4, 11, 30, 803);
    			attr_dev(li4, "data-target", "#carouselExampleCaptions");
    			attr_dev(li4, "data-slide-to", "4");
    			add_location(li4, file$4, 12, 30, 901);
    			attr_dev(li5, "data-target", "#carouselExampleCaptions");
    			attr_dev(li5, "data-slide-to", "5");
    			add_location(li5, file$4, 13, 30, 999);
    			attr_dev(li6, "data-target", "#carouselExampleCaptions");
    			attr_dev(li6, "data-slide-to", "6");
    			add_location(li6, file$4, 14, 30, 1097);
    			attr_dev(li7, "data-target", "#carouselExampleCaptions");
    			attr_dev(li7, "data-slide-to", "7");
    			add_location(li7, file$4, 15, 30, 1195);
    			attr_dev(li8, "data-target", "#carouselExampleCaptions");
    			attr_dev(li8, "data-slide-to", "8");
    			add_location(li8, file$4, 16, 30, 1293);
    			attr_dev(ol, "class", "carousel-indicators");
    			add_location(ol, file$4, 7, 28, 430);
    			if (img0.src !== (img0_src_value = "/img/drex_lichnyj_kabinet_screen.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "d-block w-100");
    			attr_dev(img0, "alt", "...");
    			add_location(img0, file$4, 20, 32, 1552);
    			attr_dev(p0, "class", "svelte-1201qmz");
    			add_location(p0, file$4, 22, 34, 1743);
    			attr_dev(div0, "class", "carousel-caption d-md-block");
    			add_location(div0, file$4, 21, 32, 1666);
    			attr_dev(div1, "class", "carousel-item active svelte-1201qmz");
    			add_location(div1, file$4, 19, 30, 1484);
    			if (img1.src !== (img1_src_value = "/img/drex_lichnyj_kabinet_screen.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "d-block w-100 slider_image");
    			attr_dev(img1, "alt", "...");
    			add_location(img1, file$4, 27, 32, 2012);
    			attr_dev(p1, "class", "svelte-1201qmz");
    			add_location(p1, file$4, 29, 34, 2216);
    			attr_dev(div2, "class", "carousel-caption d-md-block");
    			add_location(div2, file$4, 28, 32, 2139);
    			attr_dev(div3, "class", "carousel-item svelte-1201qmz");
    			add_location(div3, file$4, 26, 30, 1951);
    			if (img2.src !== (img2_src_value = "/img/drex_lichnyj_kabinet_screen.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "class", "d-block w-100 ");
    			attr_dev(img2, "alt", "...");
    			add_location(img2, file$4, 33, 32, 2435);
    			attr_dev(p2, "class", "svelte-1201qmz");
    			add_location(p2, file$4, 36, 34, 2657);
    			attr_dev(div4, "class", "carousel-caption d-md-block");
    			add_location(div4, file$4, 34, 32, 2550);
    			attr_dev(div5, "class", "carousel-item svelte-1201qmz");
    			add_location(div5, file$4, 32, 30, 2374);
    			if (img3.src !== (img3_src_value = "/img/drex_lichnyj_kabinet_screen.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "class", "d-block w-100");
    			attr_dev(img3, "alt", "...");
    			add_location(img3, file$4, 40, 32, 2891);
    			attr_dev(p3, "class", "svelte-1201qmz");
    			add_location(p3, file$4, 42, 34, 3082);
    			attr_dev(div6, "class", "carousel-caption d-md-block");
    			add_location(div6, file$4, 41, 32, 3005);
    			attr_dev(div7, "class", "carousel-item svelte-1201qmz");
    			add_location(div7, file$4, 39, 30, 2830);
    			if (img4.src !== (img4_src_value = "/img/drex_lichnyj_kabinet_screen.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "class", "d-block w-100");
    			attr_dev(img4, "alt", "...");
    			add_location(img4, file$4, 47, 32, 3350);
    			attr_dev(p4, "class", "svelte-1201qmz");
    			add_location(p4, file$4, 49, 34, 3541);
    			attr_dev(div8, "class", "carousel-caption d-md-block");
    			add_location(div8, file$4, 48, 32, 3464);
    			attr_dev(div9, "class", "carousel-item svelte-1201qmz");
    			add_location(div9, file$4, 46, 30, 3289);
    			if (img5.src !== (img5_src_value = "/img/drex_lichnyj_kabinet_screen.png")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "class", "d-block w-100");
    			attr_dev(img5, "alt", "...");
    			add_location(img5, file$4, 53, 32, 3774);
    			attr_dev(p5, "class", "svelte-1201qmz");
    			add_location(p5, file$4, 55, 34, 3965);
    			attr_dev(div10, "class", "carousel-caption d-md-block");
    			add_location(div10, file$4, 54, 32, 3888);
    			attr_dev(div11, "class", "carousel-item svelte-1201qmz");
    			add_location(div11, file$4, 52, 30, 3713);
    			if (img6.src !== (img6_src_value = "/img/drex_lichnyj_kabinet_screen.png")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "class", "d-block w-100");
    			attr_dev(img6, "alt", "...");
    			add_location(img6, file$4, 59, 32, 4192);
    			attr_dev(p6, "class", "svelte-1201qmz");
    			add_location(p6, file$4, 61, 34, 4383);
    			attr_dev(div12, "class", "carousel-caption d-md-block");
    			add_location(div12, file$4, 60, 32, 4306);
    			attr_dev(div13, "class", "carousel-item svelte-1201qmz");
    			add_location(div13, file$4, 58, 30, 4131);
    			if (img7.src !== (img7_src_value = "/img/drex_lichnyj_kabinet_screen.png")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "class", "d-block w-100");
    			attr_dev(img7, "alt", "...");
    			add_location(img7, file$4, 65, 32, 4644);
    			attr_dev(p7, "class", "svelte-1201qmz");
    			add_location(p7, file$4, 67, 34, 4835);
    			attr_dev(div14, "class", "carousel-caption d-md-block");
    			add_location(div14, file$4, 66, 32, 4758);
    			attr_dev(div15, "class", "carousel-item svelte-1201qmz");
    			add_location(div15, file$4, 64, 30, 4583);
    			if (img8.src !== (img8_src_value = "/img/drex_lichnyj_kabinet_screen.png")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "class", "d-block w-100");
    			attr_dev(img8, "alt", "...");
    			add_location(img8, file$4, 71, 32, 5065);
    			attr_dev(p8, "class", "svelte-1201qmz");
    			add_location(p8, file$4, 73, 34, 5256);
    			attr_dev(div16, "class", "carousel-caption d-md-block");
    			add_location(div16, file$4, 72, 32, 5179);
    			attr_dev(div17, "class", "carousel-item svelte-1201qmz");
    			add_location(div17, file$4, 70, 30, 5004);
    			attr_dev(div18, "class", "carousel-inner");
    			add_location(div18, file$4, 18, 28, 1424);
    			attr_dev(span0, "class", "carousel-control-prev-icon svelte-1201qmz");
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$4, 78, 30, 5567);
    			attr_dev(span1, "class", "sr-only");
    			add_location(span1, file$4, 79, 30, 5666);
    			attr_dev(a0, "class", "carousel-control-prev svelte-1201qmz");
    			attr_dev(a0, "href", "#carouselExampleCaptions");
    			attr_dev(a0, "role", "button");
    			attr_dev(a0, "data-slide", "prev");
    			add_location(a0, file$4, 77, 28, 5438);
    			attr_dev(span2, "class", "carousel-control-next-icon svelte-1201qmz");
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$4, 82, 30, 5888);
    			attr_dev(span3, "class", "sr-only");
    			add_location(span3, file$4, 83, 30, 5987);
    			attr_dev(a1, "class", "carousel-control-next svelte-1201qmz");
    			attr_dev(a1, "href", "#carouselExampleCaptions");
    			attr_dev(a1, "role", "button");
    			attr_dev(a1, "data-slide", "next");
    			add_location(a1, file$4, 81, 28, 5759);
    			attr_dev(div19, "id", "carouselExampleCaptions");
    			attr_dev(div19, "class", "carousel slide");
    			attr_dev(div19, "data-ride", "carousel");
    			add_location(div19, file$4, 6, 24, 322);
    			attr_dev(div20, "class", "col-xl-8");
    			add_location(div20, file$4, 4, 20, 201);
    			attr_dev(div21, "class", "row justify-content-center align-items-center");
    			add_location(div21, file$4, 3, 16, 120);
    			attr_dev(div22, "class", "line__slider");
    			add_location(div22, file$4, 88, 16, 6154);
    			attr_dev(p9, "class", "text_block__content svelte-1201qmz");
    			add_location(p9, file$4, 95, 32, 6498);
    			attr_dev(div23, "class", "text_content");
    			add_location(div23, file$4, 94, 28, 6438);
    			attr_dev(div24, "class", "col-xl-8");
    			add_location(div24, file$4, 93, 24, 6386);
    			attr_dev(button, "class", " form__btn svelte-1201qmz");
    			attr_dev(button, "data-toggle", "modal");
    			attr_dev(button, "data-target", "#second__modal__header");
    			add_location(button, file$4, 102, 32, 6999);
    			attr_dev(div25, "class", "button_content");
    			add_location(div25, file$4, 101, 28, 6937);
    			attr_dev(div26, "class", "col-xl-4");
    			add_location(div26, file$4, 100, 24, 6885);
    			attr_dev(div27, "class", "row justify-content-center align-items-center");
    			add_location(div27, file$4, 92, 20, 6301);
    			attr_dev(div28, "class", "access__block container svelte-1201qmz");
    			add_location(div28, file$4, 91, 16, 6242);
    			attr_dev(div29, "class", "container-fluid");
    			add_location(div29, file$4, 2, 8, 73);
    			attr_dev(div30, "class", "container slider__container svelte-1201qmz");
    			attr_dev(div30, "id", "connect_us");
    			add_location(div30, file$4, 1, 4, 6);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div30, anchor);
    			append_dev(div30, div29);
    			append_dev(div29, div21);
    			append_dev(div21, div20);
    			append_dev(div20, h1);
    			append_dev(h1, t0);
    			append_dev(div20, t1);
    			append_dev(div20, div19);
    			append_dev(div19, ol);
    			append_dev(ol, li0);
    			append_dev(ol, t2);
    			append_dev(ol, li1);
    			append_dev(ol, t3);
    			append_dev(ol, li2);
    			append_dev(ol, t4);
    			append_dev(ol, li3);
    			append_dev(ol, t5);
    			append_dev(ol, li4);
    			append_dev(ol, t6);
    			append_dev(ol, li5);
    			append_dev(ol, t7);
    			append_dev(ol, li6);
    			append_dev(ol, t8);
    			append_dev(ol, li7);
    			append_dev(ol, t9);
    			append_dev(ol, li8);
    			append_dev(div19, t10);
    			append_dev(div19, div18);
    			append_dev(div18, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t11);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t12);
    			append_dev(div18, t13);
    			append_dev(div18, div3);
    			append_dev(div3, img1);
    			append_dev(div3, t14);
    			append_dev(div3, div2);
    			append_dev(div2, p1);
    			append_dev(p1, t15);
    			append_dev(div18, t16);
    			append_dev(div18, div5);
    			append_dev(div5, img2);
    			append_dev(div5, t17);
    			append_dev(div5, div4);
    			append_dev(div4, p2);
    			append_dev(p2, t18);
    			append_dev(div18, t19);
    			append_dev(div18, div7);
    			append_dev(div7, img3);
    			append_dev(div7, t20);
    			append_dev(div7, div6);
    			append_dev(div6, p3);
    			append_dev(p3, t21);
    			append_dev(div18, t22);
    			append_dev(div18, div9);
    			append_dev(div9, img4);
    			append_dev(div9, t23);
    			append_dev(div9, div8);
    			append_dev(div8, p4);
    			append_dev(p4, t24);
    			append_dev(div18, t25);
    			append_dev(div18, div11);
    			append_dev(div11, img5);
    			append_dev(div11, t26);
    			append_dev(div11, div10);
    			append_dev(div10, p5);
    			append_dev(p5, t27);
    			append_dev(div18, t28);
    			append_dev(div18, div13);
    			append_dev(div13, img6);
    			append_dev(div13, t29);
    			append_dev(div13, div12);
    			append_dev(div12, p6);
    			append_dev(p6, t30);
    			append_dev(div18, t31);
    			append_dev(div18, div15);
    			append_dev(div15, img7);
    			append_dev(div15, t32);
    			append_dev(div15, div14);
    			append_dev(div14, p7);
    			append_dev(p7, t33);
    			append_dev(div18, t34);
    			append_dev(div18, div17);
    			append_dev(div17, img8);
    			append_dev(div17, t35);
    			append_dev(div17, div16);
    			append_dev(div16, p8);
    			append_dev(p8, t36);
    			append_dev(div19, t37);
    			append_dev(div19, a0);
    			append_dev(a0, span0);
    			append_dev(a0, t38);
    			append_dev(a0, span1);
    			append_dev(div19, t39);
    			append_dev(div19, a1);
    			append_dev(a1, span2);
    			append_dev(a1, t40);
    			append_dev(a1, span3);
    			append_dev(div29, t41);
    			append_dev(div29, div22);
    			append_dev(div29, t42);
    			append_dev(div29, div28);
    			append_dev(div28, div27);
    			append_dev(div27, div24);
    			append_dev(div24, div23);
    			append_dev(div23, p9);
    			append_dev(p9, t43);
    			append_dev(div27, t44);
    			append_dev(div27, div26);
    			append_dev(div26, div25);
    			append_dev(div25, button);
    			append_dev(button, t45);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div30);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Slider", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Slider> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Slider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Price.svelte generated by Svelte v3.29.7 */

    const file$5 = "src\\Price.svelte";

    function create_fragment$5(ctx) {
    	let div5;
    	let div0;
    	let h2;
    	let t0;
    	let t1;
    	let div4;
    	let div1;
    	let article0;
    	let h30;
    	let t2;
    	let t3;
    	let p0;
    	let t4;
    	let t5;
    	let button0;
    	let t6;
    	let t7;
    	let p1;
    	let t8;
    	let t9;
    	let div2;
    	let article1;
    	let h31;
    	let t10;
    	let t11;
    	let p2;
    	let t12;
    	let t13;
    	let button1;
    	let t14;
    	let t15;
    	let p3;
    	let t16;
    	let t17;
    	let div3;
    	let article2;
    	let h32;
    	let t18;
    	let t19;
    	let p4;
    	let t20;
    	let t21;
    	let button2;
    	let t22;
    	let t23;
    	let p5;
    	let t24;
    	let t25;
    	let p6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text("Три тарифа");
    			t1 = space();
    			div4 = element("div");
    			div1 = element("div");
    			article0 = element("article");
    			h30 = element("h3");
    			t2 = text("Базовый");
    			t3 = space();
    			p0 = element("p");
    			t4 = text("5 подключений* в день\r\n                    к платформе онлайн-\r\n                    трансляции");
    			t5 = space();
    			button0 = element("button");
    			t6 = text("3 месяца");
    			t7 = space();
    			p1 = element("p");
    			t8 = text("150 000 р.");
    			t9 = space();
    			div2 = element("div");
    			article1 = element("article");
    			h31 = element("h3");
    			t10 = text("Расширенный");
    			t11 = space();
    			p2 = element("p");
    			t12 = text("10 подключений* в день\r\n                    к платформе онлайн-\r\n                    трансляции");
    			t13 = space();
    			button1 = element("button");
    			t14 = text("6 месяцев");
    			t15 = space();
    			p3 = element("p");
    			t16 = text("300 000 р.");
    			t17 = space();
    			div3 = element("div");
    			article2 = element("article");
    			h32 = element("h3");
    			t18 = text("Безлимитный");
    			t19 = space();
    			p4 = element("p");
    			t20 = text("неограниченное количество\r\n                    подключений в день");
    			t21 = space();
    			button2 = element("button");
    			t22 = text("12 месяцев");
    			t23 = space();
    			p5 = element("p");
    			t24 = text("1 500 000 р.");
    			t25 = space();
    			p6 = element("p");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div5 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div5_nodes = children(div5);
    			div0 = claim_element(div5_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			h2 = claim_element(div0_nodes, "H2", { class: true });
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, "Три тарифа");
    			h2_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			t1 = claim_space(div5_nodes);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			div1 = claim_element(div4_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			article0 = claim_element(div1_nodes, "ARTICLE", { class: true });
    			var article0_nodes = children(article0);
    			h30 = claim_element(article0_nodes, "H3", { class: true });
    			var h30_nodes = children(h30);
    			t2 = claim_text(h30_nodes, "Базовый");
    			h30_nodes.forEach(detach_dev);
    			t3 = claim_space(article0_nodes);
    			p0 = claim_element(article0_nodes, "P", { class: true });
    			var p0_nodes = children(p0);
    			t4 = claim_text(p0_nodes, "5 подключений* в день\r\n                    к платформе онлайн-\r\n                    трансляции");
    			p0_nodes.forEach(detach_dev);
    			t5 = claim_space(article0_nodes);

    			button0 = claim_element(article0_nodes, "BUTTON", {
    				type: true,
    				"data-toggle": true,
    				"data-target": true,
    				class: true
    			});

    			var button0_nodes = children(button0);
    			t6 = claim_text(button0_nodes, "3 месяца");
    			button0_nodes.forEach(detach_dev);
    			t7 = claim_space(article0_nodes);
    			p1 = claim_element(article0_nodes, "P", { class: true });
    			var p1_nodes = children(p1);
    			t8 = claim_text(p1_nodes, "150 000 р.");
    			p1_nodes.forEach(detach_dev);
    			article0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			t9 = claim_space(div4_nodes);
    			div2 = claim_element(div4_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			article1 = claim_element(div2_nodes, "ARTICLE", { class: true });
    			var article1_nodes = children(article1);
    			h31 = claim_element(article1_nodes, "H3", { class: true });
    			var h31_nodes = children(h31);
    			t10 = claim_text(h31_nodes, "Расширенный");
    			h31_nodes.forEach(detach_dev);
    			t11 = claim_space(article1_nodes);
    			p2 = claim_element(article1_nodes, "P", { class: true });
    			var p2_nodes = children(p2);
    			t12 = claim_text(p2_nodes, "10 подключений* в день\r\n                    к платформе онлайн-\r\n                    трансляции");
    			p2_nodes.forEach(detach_dev);
    			t13 = claim_space(article1_nodes);

    			button1 = claim_element(article1_nodes, "BUTTON", {
    				type: true,
    				"data-toggle": true,
    				"data-target": true,
    				class: true
    			});

    			var button1_nodes = children(button1);
    			t14 = claim_text(button1_nodes, "6 месяцев");
    			button1_nodes.forEach(detach_dev);
    			t15 = claim_space(article1_nodes);
    			p3 = claim_element(article1_nodes, "P", { class: true });
    			var p3_nodes = children(p3);
    			t16 = claim_text(p3_nodes, "300 000 р.");
    			p3_nodes.forEach(detach_dev);
    			article1_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			t17 = claim_space(div4_nodes);
    			div3 = claim_element(div4_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			article2 = claim_element(div3_nodes, "ARTICLE", { class: true });
    			var article2_nodes = children(article2);
    			h32 = claim_element(article2_nodes, "H3", { class: true });
    			var h32_nodes = children(h32);
    			t18 = claim_text(h32_nodes, "Безлимитный");
    			h32_nodes.forEach(detach_dev);
    			t19 = claim_space(article2_nodes);
    			p4 = claim_element(article2_nodes, "P", { class: true });
    			var p4_nodes = children(p4);
    			t20 = claim_text(p4_nodes, "неограниченное количество\r\n                    подключений в день");
    			p4_nodes.forEach(detach_dev);
    			t21 = claim_space(article2_nodes);

    			button2 = claim_element(article2_nodes, "BUTTON", {
    				type: true,
    				"data-toggle": true,
    				"data-target": true,
    				class: true
    			});

    			var button2_nodes = children(button2);
    			t22 = claim_text(button2_nodes, "12 месяцев");
    			button2_nodes.forEach(detach_dev);
    			t23 = claim_space(article2_nodes);
    			p5 = claim_element(article2_nodes, "P", { class: true });
    			var p5_nodes = children(p5);
    			t24 = claim_text(p5_nodes, "1 500 000 р.");
    			p5_nodes.forEach(detach_dev);
    			article2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			t25 = claim_space(div4_nodes);
    			p6 = claim_element(div4_nodes, "P", { class: true });
    			var p6_nodes = children(p6);
    			p6_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h2, "class", "svelte-19un1gu");
    			add_location(h2, file$5, 40, 8, 1209);
    			attr_dev(div0, "class", "container text-center");
    			add_location(div0, file$5, 39, 4, 1164);
    			attr_dev(h30, "class", "svelte-19un1gu");
    			add_location(h30, file$5, 45, 16, 1520);
    			attr_dev(p0, "class", "text__price svelte-19un1gu");
    			add_location(p0, file$5, 46, 16, 1554);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", "#first__vertical__popup");
    			attr_dev(button0, "class", "month__price first__month svelte-19un1gu");
    			add_location(button0, file$5, 51, 16, 1733);
    			attr_dev(p1, "class", "salary__price svelte-19un1gu");
    			add_location(p1, file$5, 54, 16, 1922);
    			attr_dev(article0, "class", "first__price price-card_animation svelte-19un1gu");
    			add_location(article0, file$5, 44, 12, 1399);
    			attr_dev(div1, "class", "col-xxl-4 col-xl-4 col-lg-4 col-md-7 col-sm-8 wrapper__price");
    			add_location(div1, file$5, 43, 8, 1311);
    			attr_dev(h31, "class", "svelte-19un1gu");
    			add_location(h31, file$5, 61, 16, 2262);
    			attr_dev(p2, "class", "text__price svelte-19un1gu");
    			add_location(p2, file$5, 62, 16, 2300);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "data-toggle", "modal");
    			attr_dev(button1, "data-target", "#second__vertical__popup");
    			attr_dev(button1, "class", "month__price second__month svelte-19un1gu");
    			add_location(button1, file$5, 67, 16, 2480);
    			attr_dev(p3, "class", "salary__price svelte-19un1gu");
    			add_location(p3, file$5, 70, 16, 2672);
    			attr_dev(article1, "class", "second__price price-card_animation svelte-19un1gu");
    			add_location(article1, file$5, 60, 12, 2140);
    			attr_dev(div2, "class", "col-xxl-4 col-xl-4 col-lg-4 col-md-7 col-sm-8 wrapper__price");
    			add_location(div2, file$5, 59, 8, 2051);
    			attr_dev(h32, "class", "svelte-19un1gu");
    			add_location(h32, file$5, 77, 16, 3011);
    			attr_dev(p4, "class", "text__price svelte-19un1gu");
    			add_location(p4, file$5, 78, 16, 3049);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "data-toggle", "modal");
    			attr_dev(button2, "data-target", "#third__vertical__popup");
    			attr_dev(button2, "class", "month__price third__month svelte-19un1gu");
    			add_location(button2, file$5, 84, 16, 3281);
    			attr_dev(p5, "class", "salary__price svelte-19un1gu");
    			add_location(p5, file$5, 87, 16, 3472);
    			attr_dev(article2, "class", "thirty__price price-card_animation svelte-19un1gu");
    			add_location(article2, file$5, 76, 12, 2889);
    			attr_dev(div3, "class", "col-xxl-4 col-xl-4 col-lg-4 col-md-7 col-sm-8 wrapper__price");
    			add_location(div3, file$5, 75, 8, 2801);
    			attr_dev(p6, "class", "remark svelte-19un1gu");
    			add_location(p6, file$5, 92, 8, 3603);
    			attr_dev(div4, "class", "row justify-content-evenly card_container");
    			add_location(div4, file$5, 42, 4, 1246);
    			attr_dev(div5, "class", "container price__block row-flex svelte-19un1gu");
    			attr_dev(div5, "id", "price");
    			add_location(div5, file$5, 38, 0, 1102);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, article0);
    			append_dev(article0, h30);
    			append_dev(h30, t2);
    			append_dev(article0, t3);
    			append_dev(article0, p0);
    			append_dev(p0, t4);
    			append_dev(article0, t5);
    			append_dev(article0, button0);
    			append_dev(button0, t6);
    			append_dev(article0, t7);
    			append_dev(article0, p1);
    			append_dev(p1, t8);
    			append_dev(div4, t9);
    			append_dev(div4, div2);
    			append_dev(div2, article1);
    			append_dev(article1, h31);
    			append_dev(h31, t10);
    			append_dev(article1, t11);
    			append_dev(article1, p2);
    			append_dev(p2, t12);
    			append_dev(article1, t13);
    			append_dev(article1, button1);
    			append_dev(button1, t14);
    			append_dev(article1, t15);
    			append_dev(article1, p3);
    			append_dev(p3, t16);
    			append_dev(div4, t17);
    			append_dev(div4, div3);
    			append_dev(div3, article2);
    			append_dev(article2, h32);
    			append_dev(h32, t18);
    			append_dev(article2, t19);
    			append_dev(article2, p4);
    			append_dev(p4, t20);
    			append_dev(article2, t21);
    			append_dev(article2, button2);
    			append_dev(button2, t22);
    			append_dev(article2, t23);
    			append_dev(article2, p5);
    			append_dev(p5, t24);
    			append_dev(div4, t25);
    			append_dev(div4, p6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(article0, "mouseover", setName_1, false, false, false),
    					listen_dev(article0, "mouseout", returnName_1, false, false, false),
    					listen_dev(article1, "mouseover", setName_2, false, false, false),
    					listen_dev(article1, "mouseout", returnName_2, false, false, false),
    					listen_dev(article2, "mouseover", setName_3, false, false, false),
    					listen_dev(article2, "mouseout", returnName_3, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function setName_1() {
    	document.querySelector(".first__month").textContent = "Подробнее";
    }

    function setName_2() {
    	document.querySelector(".second__month").textContent = "Подробнее";
    }

    function setName_3() {
    	document.querySelector(".third__month").textContent = "Подробнее";
    }

    function returnName_1() {
    	document.querySelector(".first__month").textContent = "3 месяца";
    }

    function returnName_2() {
    	document.querySelector(".second__month").textContent = "6 месяцев";
    }

    function returnName_3() {
    	document.querySelector(".third__month").textContent = "12 месяцев";
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Price", slots, []);
    	
    	
    	
    	
    	
    	
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Price> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		setName_1,
    		setName_2,
    		setName_3,
    		returnName_1,
    		returnName_2,
    		returnName_3
    	});

    	return [];
    }

    class Price extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Price",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Advantage.svelte generated by Svelte v3.29.7 */

    const { console: console_1 } = globals;
    const file$6 = "src\\Advantage.svelte";

    function create_fragment$6(ctx) {
    	let div26;
    	let div25;
    	let h2;
    	let t0;
    	let t1;
    	let p0;
    	let t2;
    	let t3;
    	let div24;
    	let div23;
    	let div8;
    	let div3;
    	let div2;
    	let div0;
    	let p1;
    	let span0;
    	let t4;
    	let t5;
    	let t6;
    	let div1;
    	let p2;
    	let t7;
    	let t8;
    	let div7;
    	let div6;
    	let div4;
    	let p3;
    	let span1;
    	let t9;
    	let t10;
    	let t11;
    	let div5;
    	let p4;
    	let t12;
    	let t13;
    	let div13;
    	let div12;
    	let div11;
    	let div9;
    	let p5;
    	let span2;
    	let t14;
    	let t15;
    	let t16;
    	let div10;
    	let p6;
    	let t17;
    	let t18;
    	let div22;
    	let div17;
    	let div16;
    	let div14;
    	let p7;
    	let span3;
    	let t19;
    	let t20;
    	let t21;
    	let div15;
    	let ul;
    	let li0;
    	let t22;
    	let t23;
    	let li1;
    	let t24;
    	let t25;
    	let li2;
    	let t26;
    	let t27;
    	let div21;
    	let div20;
    	let div18;
    	let p8;
    	let span4;
    	let t28;
    	let t29;
    	let t30;
    	let div19;
    	let p9;
    	let t31;

    	const block = {
    		c: function create() {
    			div26 = element("div");
    			div25 = element("div");
    			h2 = element("h2");
    			t0 = text("Преимущества");
    			t1 = space();
    			p0 = element("p");
    			t2 = text("Корпоративного онлайн-университета");
    			t3 = space();
    			div24 = element("div");
    			div23 = element("div");
    			div8 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			p1 = element("p");
    			span0 = element("span");
    			t4 = text("01");
    			t5 = text("Работаем с 2002 года");
    			t6 = space();
    			div1 = element("div");
    			p2 = element("p");
    			t7 = text("Более 150 000 выпускников и 15 000 компаний\r\n                                    доверяют нам и профессионализму наших экспертов");
    			t8 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			p3 = element("p");
    			span1 = element("span");
    			t9 = text("02");
    			t10 = text("Системный подход");
    			t11 = space();
    			div5 = element("div");
    			p4 = element("p");
    			t12 = text("Планирование, организация и контроль\r\n                                    - определяющие факторы эффективности обучения");
    			t13 = space();
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div9 = element("div");
    			p5 = element("p");
    			span2 = element("span");
    			t14 = text("05");
    			t15 = text("Стабильность обучения");
    			t16 = space();
    			div10 = element("div");
    			p6 = element("p");
    			t17 = text("Непрерывное обучение в течение \r\n                                    календарного года");
    			t18 = space();
    			div22 = element("div");
    			div17 = element("div");
    			div16 = element("div");
    			div14 = element("div");
    			p7 = element("p");
    			span3 = element("span");
    			t19 = text("03");
    			t20 = text("Гарантия качества");
    			t21 = space();
    			div15 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			t22 = text("Сертификат ГОСТ Р ИСО 9001-2015");
    			t23 = space();
    			li1 = element("li");
    			t24 = text("Лицензия на образовательную деятельность");
    			t25 = space();
    			li2 = element("li");
    			t26 = text("Постоянная актуализация информации");
    			t27 = space();
    			div21 = element("div");
    			div20 = element("div");
    			div18 = element("div");
    			p8 = element("p");
    			span4 = element("span");
    			t28 = text("04");
    			t29 = text("Доступность обучения");
    			t30 = space();
    			div19 = element("div");
    			p9 = element("p");
    			t31 = text("Линейка программ для всех уровней и \r\n                                    категорий сотрудников компании");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div26 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div26_nodes = children(div26);
    			div25 = claim_element(div26_nodes, "DIV", { class: true });
    			var div25_nodes = children(div25);
    			h2 = claim_element(div25_nodes, "H2", { class: true });
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, "Преимущества");
    			h2_nodes.forEach(detach_dev);
    			t1 = claim_space(div25_nodes);
    			p0 = claim_element(div25_nodes, "P", { class: true });
    			var p0_nodes = children(p0);
    			t2 = claim_text(p0_nodes, "Корпоративного онлайн-университета");
    			p0_nodes.forEach(detach_dev);
    			t3 = claim_space(div25_nodes);
    			div24 = claim_element(div25_nodes, "DIV", { class: true });
    			var div24_nodes = children(div24);
    			div23 = claim_element(div24_nodes, "DIV", { class: true });
    			var div23_nodes = children(div23);
    			div8 = claim_element(div23_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);
    			div3 = claim_element(div8_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			div0 = claim_element(div2_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			p1 = claim_element(div0_nodes, "P", { class: true });
    			var p1_nodes = children(p1);
    			span0 = claim_element(p1_nodes, "SPAN", { class: true });
    			var span0_nodes = children(span0);
    			t4 = claim_text(span0_nodes, "01");
    			span0_nodes.forEach(detach_dev);
    			t5 = claim_text(p1_nodes, "Работаем с 2002 года");
    			p1_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			t6 = claim_space(div2_nodes);
    			div1 = claim_element(div2_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			p2 = claim_element(div1_nodes, "P", { class: true });
    			var p2_nodes = children(p2);
    			t7 = claim_text(p2_nodes, "Более 150 000 выпускников и 15 000 компаний\r\n                                    доверяют нам и профессионализму наших экспертов");
    			p2_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			t8 = claim_space(div8_nodes);
    			div7 = claim_element(div8_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			div6 = claim_element(div7_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			div4 = claim_element(div6_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			p3 = claim_element(div4_nodes, "P", { class: true });
    			var p3_nodes = children(p3);
    			span1 = claim_element(p3_nodes, "SPAN", { class: true });
    			var span1_nodes = children(span1);
    			t9 = claim_text(span1_nodes, "02");
    			span1_nodes.forEach(detach_dev);
    			t10 = claim_text(p3_nodes, "Системный подход");
    			p3_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			t11 = claim_space(div6_nodes);
    			div5 = claim_element(div6_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			p4 = claim_element(div5_nodes, "P", { class: true });
    			var p4_nodes = children(p4);
    			t12 = claim_text(p4_nodes, "Планирование, организация и контроль\r\n                                    - определяющие факторы эффективности обучения");
    			p4_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			div6_nodes.forEach(detach_dev);
    			div7_nodes.forEach(detach_dev);
    			div8_nodes.forEach(detach_dev);
    			t13 = claim_space(div23_nodes);
    			div13 = claim_element(div23_nodes, "DIV", { class: true });
    			var div13_nodes = children(div13);
    			div12 = claim_element(div13_nodes, "DIV", { class: true });
    			var div12_nodes = children(div12);
    			div11 = claim_element(div12_nodes, "DIV", { class: true });
    			var div11_nodes = children(div11);
    			div9 = claim_element(div11_nodes, "DIV", { class: true });
    			var div9_nodes = children(div9);
    			p5 = claim_element(div9_nodes, "P", { class: true });
    			var p5_nodes = children(p5);
    			span2 = claim_element(p5_nodes, "SPAN", { class: true });
    			var span2_nodes = children(span2);
    			t14 = claim_text(span2_nodes, "05");
    			span2_nodes.forEach(detach_dev);
    			t15 = claim_text(p5_nodes, "Стабильность обучения");
    			p5_nodes.forEach(detach_dev);
    			div9_nodes.forEach(detach_dev);
    			t16 = claim_space(div11_nodes);
    			div10 = claim_element(div11_nodes, "DIV", { class: true });
    			var div10_nodes = children(div10);
    			p6 = claim_element(div10_nodes, "P", { class: true });
    			var p6_nodes = children(p6);
    			t17 = claim_text(p6_nodes, "Непрерывное обучение в течение \r\n                                    календарного года");
    			p6_nodes.forEach(detach_dev);
    			div10_nodes.forEach(detach_dev);
    			div11_nodes.forEach(detach_dev);
    			div12_nodes.forEach(detach_dev);
    			div13_nodes.forEach(detach_dev);
    			t18 = claim_space(div23_nodes);
    			div22 = claim_element(div23_nodes, "DIV", { class: true });
    			var div22_nodes = children(div22);
    			div17 = claim_element(div22_nodes, "DIV", { class: true });
    			var div17_nodes = children(div17);
    			div16 = claim_element(div17_nodes, "DIV", { class: true });
    			var div16_nodes = children(div16);
    			div14 = claim_element(div16_nodes, "DIV", { class: true });
    			var div14_nodes = children(div14);
    			p7 = claim_element(div14_nodes, "P", { class: true });
    			var p7_nodes = children(p7);
    			span3 = claim_element(p7_nodes, "SPAN", { class: true });
    			var span3_nodes = children(span3);
    			t19 = claim_text(span3_nodes, "03");
    			span3_nodes.forEach(detach_dev);
    			t20 = claim_text(p7_nodes, "Гарантия качества");
    			p7_nodes.forEach(detach_dev);
    			div14_nodes.forEach(detach_dev);
    			t21 = claim_space(div16_nodes);
    			div15 = claim_element(div16_nodes, "DIV", { class: true });
    			var div15_nodes = children(div15);
    			ul = claim_element(div15_nodes, "UL", { class: true });
    			var ul_nodes = children(ul);
    			li0 = claim_element(ul_nodes, "LI", { class: true });
    			var li0_nodes = children(li0);
    			t22 = claim_text(li0_nodes, "Сертификат ГОСТ Р ИСО 9001-2015");
    			li0_nodes.forEach(detach_dev);
    			t23 = claim_space(ul_nodes);
    			li1 = claim_element(ul_nodes, "LI", { class: true });
    			var li1_nodes = children(li1);
    			t24 = claim_text(li1_nodes, "Лицензия на образовательную деятельность");
    			li1_nodes.forEach(detach_dev);
    			t25 = claim_space(ul_nodes);
    			li2 = claim_element(ul_nodes, "LI", { class: true });
    			var li2_nodes = children(li2);
    			t26 = claim_text(li2_nodes, "Постоянная актуализация информации");
    			li2_nodes.forEach(detach_dev);
    			ul_nodes.forEach(detach_dev);
    			div15_nodes.forEach(detach_dev);
    			div16_nodes.forEach(detach_dev);
    			div17_nodes.forEach(detach_dev);
    			t27 = claim_space(div22_nodes);
    			div21 = claim_element(div22_nodes, "DIV", { class: true });
    			var div21_nodes = children(div21);
    			div20 = claim_element(div21_nodes, "DIV", { class: true });
    			var div20_nodes = children(div20);
    			div18 = claim_element(div20_nodes, "DIV", { class: true });
    			var div18_nodes = children(div18);
    			p8 = claim_element(div18_nodes, "P", { class: true });
    			var p8_nodes = children(p8);
    			span4 = claim_element(p8_nodes, "SPAN", { class: true });
    			var span4_nodes = children(span4);
    			t28 = claim_text(span4_nodes, "04");
    			span4_nodes.forEach(detach_dev);
    			t29 = claim_text(p8_nodes, "Доступность обучения");
    			p8_nodes.forEach(detach_dev);
    			div18_nodes.forEach(detach_dev);
    			t30 = claim_space(div20_nodes);
    			div19 = claim_element(div20_nodes, "DIV", { class: true });
    			var div19_nodes = children(div19);
    			p9 = claim_element(div19_nodes, "P", { class: true });
    			var p9_nodes = children(p9);
    			t31 = claim_text(p9_nodes, "Линейка программ для всех уровней и \r\n                                    категорий сотрудников компании");
    			p9_nodes.forEach(detach_dev);
    			div19_nodes.forEach(detach_dev);
    			div20_nodes.forEach(detach_dev);
    			div21_nodes.forEach(detach_dev);
    			div22_nodes.forEach(detach_dev);
    			div23_nodes.forEach(detach_dev);
    			div24_nodes.forEach(detach_dev);
    			div25_nodes.forEach(detach_dev);
    			div26_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h2, "class", "title title__one svelte-1i0hz4a");
    			add_location(h2, file$6, 30, 8, 964);
    			attr_dev(p0, "class", "title title__two svelte-1i0hz4a");
    			add_location(p0, file$6, 31, 8, 1020);
    			attr_dev(span0, "class", "title_text_number title_text_anim_1 svelte-1i0hz4a");
    			add_location(span0, file$6, 38, 54, 1474);
    			attr_dev(p1, "class", "title_text svelte-1i0hz4a");
    			add_location(p1, file$6, 38, 32, 1452);
    			attr_dev(div0, "class", "list-item_title ");
    			add_location(div0, file$6, 37, 28, 1388);
    			attr_dev(p2, "class", "desc_text svelte-1i0hz4a");
    			add_location(p2, file$6, 41, 32, 1685);
    			attr_dev(div1, "class", "list-item_desc");
    			add_location(div1, file$6, 40, 28, 1623);
    			attr_dev(div2, "class", "advantage__list-item first_block");
    			add_location(div2, file$6, 36, 24, 1312);
    			attr_dev(div3, "class", "col-xl-4 col-xs-10 col-sm-10 ");
    			add_location(div3, file$6, 35, 20, 1243);
    			attr_dev(span1, "class", "title_text_number title_text_anim_2 svelte-1i0hz4a");
    			add_location(span1, file$6, 55, 54, 2533);
    			attr_dev(p3, "class", "title_text svelte-1i0hz4a");
    			add_location(p3, file$6, 55, 32, 2511);
    			attr_dev(div4, "class", "list-item_title");
    			add_location(div4, file$6, 54, 28, 2448);
    			attr_dev(p4, "class", "desc_text svelte-1i0hz4a");
    			add_location(p4, file$6, 63, 32, 3124);
    			attr_dev(div5, "class", "list-item_desc");
    			add_location(div5, file$6, 57, 28, 2679);
    			attr_dev(div6, "class", "advantage__list-item second_block");
    			add_location(div6, file$6, 53, 24, 2371);
    			attr_dev(div7, "class", "col-xl-4  col-xs-10 col-sm-10 ");
    			add_location(div7, file$6, 52, 20, 2301);
    			attr_dev(div8, "class", "row justify-content-between");
    			add_location(div8, file$6, 34, 16, 1180);
    			attr_dev(span2, "class", "title_text_number title_text_anim_5 svelte-1i0hz4a");
    			add_location(span2, file$6, 75, 66, 3782);
    			attr_dev(p5, "class", "title_text five_number svelte-1i0hz4a");
    			add_location(p5, file$6, 75, 32, 3748);
    			attr_dev(div9, "class", "list-item_title");
    			add_location(div9, file$6, 74, 28, 3685);
    			attr_dev(p6, "class", "desc_text svelte-1i0hz4a");
    			add_location(p6, file$6, 78, 32, 3994);
    			attr_dev(div10, "class", "list-item_desc");
    			add_location(div10, file$6, 77, 28, 3932);
    			attr_dev(div11, "class", "advantage__list-item third_block");
    			add_location(div11, file$6, 73, 24, 3609);
    			attr_dev(div12, "class", "col-xl-4 col-xs-10 col-sm-10 ");
    			add_location(div12, file$6, 72, 20, 3540);
    			attr_dev(div13, "class", "row justify-content-center");
    			add_location(div13, file$6, 71, 16, 3478);
    			attr_dev(span3, "class", "title_text_number title_text_anim_3 svelte-1i0hz4a");
    			add_location(span3, file$6, 93, 67, 4859);
    			attr_dev(p7, "class", "title_text third_number svelte-1i0hz4a");
    			add_location(p7, file$6, 93, 32, 4824);
    			attr_dev(div14, "class", "list-item_title");
    			add_location(div14, file$6, 92, 28, 4761);
    			attr_dev(li0, "class", "desc_text svelte-1i0hz4a");
    			add_location(li0, file$6, 97, 36, 5159);
    			attr_dev(li1, "class", "desc_text svelte-1i0hz4a");
    			add_location(li1, file$6, 98, 36, 5255);
    			attr_dev(li2, "class", "desc_text svelte-1i0hz4a");
    			add_location(li2, file$6, 99, 36, 5361);
    			attr_dev(ul, "class", "item-desc_content third_item-desc_content");
    			add_location(ul, file$6, 96, 32, 5067);
    			attr_dev(div15, "class", "list-item_desc");
    			add_location(div15, file$6, 95, 28, 5005);
    			attr_dev(div16, "class", "advantage__list-item four_block");
    			add_location(div16, file$6, 91, 24, 4686);
    			attr_dev(div17, "class", "col-xl-4 col-xs-10 col-sm-10 ");
    			add_location(div17, file$6, 90, 20, 4617);
    			attr_dev(span4, "class", "title_text_number title_text_anim_4 svelte-1i0hz4a");
    			add_location(span4, file$6, 107, 66, 5821);
    			attr_dev(p8, "class", "title_text four_number svelte-1i0hz4a");
    			add_location(p8, file$6, 107, 32, 5787);
    			attr_dev(div18, "class", "list-item_title");
    			add_location(div18, file$6, 106, 28, 5724);
    			attr_dev(p9, "class", "desc_text svelte-1i0hz4a");
    			add_location(p9, file$6, 110, 32, 6033);
    			attr_dev(div19, "class", "list-item_desc ");
    			add_location(div19, file$6, 109, 28, 5970);
    			attr_dev(div20, "class", "advantage__list-item five_block");
    			add_location(div20, file$6, 105, 24, 5649);
    			attr_dev(div21, "class", "col-xl-4 col-xs-10 col-sm-10  ");
    			add_location(div21, file$6, 104, 20, 5579);
    			attr_dev(div22, "class", "row justify-content-between");
    			add_location(div22, file$6, 89, 16, 4554);
    			attr_dev(div23, "class", "advantage__list");
    			add_location(div23, file$6, 33, 12, 1133);
    			attr_dev(div24, "class", "container");
    			add_location(div24, file$6, 32, 8, 1096);
    			attr_dev(div25, "class", "container-fluid");
    			add_location(div25, file$6, 29, 4, 925);
    			attr_dev(div26, "class", "advantage svelte-1i0hz4a");
    			attr_dev(div26, "id", "advantage");
    			add_location(div26, file$6, 28, 0, 881);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div26, anchor);
    			append_dev(div26, div25);
    			append_dev(div25, h2);
    			append_dev(h2, t0);
    			append_dev(div25, t1);
    			append_dev(div25, p0);
    			append_dev(p0, t2);
    			append_dev(div25, t3);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, div8);
    			append_dev(div8, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, p1);
    			append_dev(p1, span0);
    			append_dev(span0, t4);
    			append_dev(p1, t5);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, p2);
    			append_dev(p2, t7);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, p3);
    			append_dev(p3, span1);
    			append_dev(span1, t9);
    			append_dev(p3, t10);
    			append_dev(div6, t11);
    			append_dev(div6, div5);
    			append_dev(div5, p4);
    			append_dev(p4, t12);
    			append_dev(div23, t13);
    			append_dev(div23, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div9);
    			append_dev(div9, p5);
    			append_dev(p5, span2);
    			append_dev(span2, t14);
    			append_dev(p5, t15);
    			append_dev(div11, t16);
    			append_dev(div11, div10);
    			append_dev(div10, p6);
    			append_dev(p6, t17);
    			append_dev(div23, t18);
    			append_dev(div23, div22);
    			append_dev(div22, div17);
    			append_dev(div17, div16);
    			append_dev(div16, div14);
    			append_dev(div14, p7);
    			append_dev(p7, span3);
    			append_dev(span3, t19);
    			append_dev(p7, t20);
    			append_dev(div16, t21);
    			append_dev(div16, div15);
    			append_dev(div15, ul);
    			append_dev(ul, li0);
    			append_dev(li0, t22);
    			append_dev(ul, t23);
    			append_dev(ul, li1);
    			append_dev(li1, t24);
    			append_dev(ul, t25);
    			append_dev(ul, li2);
    			append_dev(li2, t26);
    			append_dev(div22, t27);
    			append_dev(div22, div21);
    			append_dev(div21, div20);
    			append_dev(div20, div18);
    			append_dev(div18, p8);
    			append_dev(p8, span4);
    			append_dev(span4, t28);
    			append_dev(p8, t29);
    			append_dev(div20, t30);
    			append_dev(div20, div19);
    			append_dev(div19, p9);
    			append_dev(p9, t31);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div26);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Advantage", slots, []);

    	window.addEventListener("DOMContentLoaded", function () {
    		let widthWindow = window.innerWidth;
    		console.log(typeof widthWindow);
    		let numberTo3 = document.querySelector(".title_text_anim_5");
    		let numberTo4 = document.querySelector(".title_text_anim_3");
    		let numberTo5 = document.querySelector(".title_text_anim_4");

    		if (widthWindow < 960) {
    			numberTo3.textContent = "03";
    			numberTo4.textContent = "04";
    			numberTo5.textContent = "05";
    		}

    		let windowHWidth = document.documentElement.clientWidth;
    		console.log(windowHWidth);

    		if (windowHWidth < 1400) {
    			let elem = document.querySelector(".advantage");
    			elem.classList.add("container");
    		} else {
    			elem.classList.remove("container");
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Advantage> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Advantage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Advantage",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Cooperative.svelte generated by Svelte v3.29.7 */

    const file$7 = "src\\Cooperative.svelte";

    function create_fragment$7(ctx) {
    	let div15;
    	let h2;
    	let t0;
    	let t1;
    	let div4;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let div2;
    	let img2;
    	let img2_src_value;
    	let t4;
    	let div3;
    	let img3;
    	let img3_src_value;
    	let t5;
    	let div9;
    	let div5;
    	let img4;
    	let img4_src_value;
    	let t6;
    	let div6;
    	let img5;
    	let img5_src_value;
    	let t7;
    	let div7;
    	let img6;
    	let img6_src_value;
    	let t8;
    	let div8;
    	let img7;
    	let img7_src_value;
    	let t9;
    	let div14;
    	let div10;
    	let img8;
    	let img8_src_value;
    	let t10;
    	let div11;
    	let img9;
    	let img9_src_value;
    	let t11;
    	let div12;
    	let img10;
    	let img10_src_value;
    	let t12;
    	let div13;
    	let img11;
    	let img11_src_value;

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			h2 = element("h2");
    			t0 = text("Мы сотрудничаем");
    			t1 = space();
    			div4 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t2 = space();
    			div1 = element("div");
    			img1 = element("img");
    			t3 = space();
    			div2 = element("div");
    			img2 = element("img");
    			t4 = space();
    			div3 = element("div");
    			img3 = element("img");
    			t5 = space();
    			div9 = element("div");
    			div5 = element("div");
    			img4 = element("img");
    			t6 = space();
    			div6 = element("div");
    			img5 = element("img");
    			t7 = space();
    			div7 = element("div");
    			img6 = element("img");
    			t8 = space();
    			div8 = element("div");
    			img7 = element("img");
    			t9 = space();
    			div14 = element("div");
    			div10 = element("div");
    			img8 = element("img");
    			t10 = space();
    			div11 = element("div");
    			img9 = element("img");
    			t11 = space();
    			div12 = element("div");
    			img10 = element("img");
    			t12 = space();
    			div13 = element("div");
    			img11 = element("img");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div15 = claim_element(nodes, "DIV", { class: true });
    			var div15_nodes = children(div15);
    			h2 = claim_element(div15_nodes, "H2", { class: true });
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, "Мы сотрудничаем");
    			h2_nodes.forEach(detach_dev);
    			t1 = claim_space(div15_nodes);
    			div4 = claim_element(div15_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			div0 = claim_element(div4_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			img0 = claim_element(div0_nodes, "IMG", { class: true, src: true, alt: true });
    			div0_nodes.forEach(detach_dev);
    			t2 = claim_space(div4_nodes);
    			div1 = claim_element(div4_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			img1 = claim_element(div1_nodes, "IMG", { class: true, src: true, alt: true });
    			div1_nodes.forEach(detach_dev);
    			t3 = claim_space(div4_nodes);
    			div2 = claim_element(div4_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			img2 = claim_element(div2_nodes, "IMG", { class: true, src: true, alt: true });
    			div2_nodes.forEach(detach_dev);
    			t4 = claim_space(div4_nodes);
    			div3 = claim_element(div4_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			img3 = claim_element(div3_nodes, "IMG", { class: true, src: true, alt: true });
    			div3_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			t5 = claim_space(div15_nodes);
    			div9 = claim_element(div15_nodes, "DIV", { class: true });
    			var div9_nodes = children(div9);
    			div5 = claim_element(div9_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			img4 = claim_element(div5_nodes, "IMG", { class: true, src: true, alt: true });
    			div5_nodes.forEach(detach_dev);
    			t6 = claim_space(div9_nodes);
    			div6 = claim_element(div9_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			img5 = claim_element(div6_nodes, "IMG", { class: true, src: true, alt: true });
    			div6_nodes.forEach(detach_dev);
    			t7 = claim_space(div9_nodes);
    			div7 = claim_element(div9_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			img6 = claim_element(div7_nodes, "IMG", { class: true, src: true, alt: true });
    			div7_nodes.forEach(detach_dev);
    			t8 = claim_space(div9_nodes);
    			div8 = claim_element(div9_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);
    			img7 = claim_element(div8_nodes, "IMG", { class: true, src: true, alt: true });
    			div8_nodes.forEach(detach_dev);
    			div9_nodes.forEach(detach_dev);
    			t9 = claim_space(div15_nodes);
    			div14 = claim_element(div15_nodes, "DIV", { class: true });
    			var div14_nodes = children(div14);
    			div10 = claim_element(div14_nodes, "DIV", { class: true });
    			var div10_nodes = children(div10);
    			img8 = claim_element(div10_nodes, "IMG", { class: true, src: true, alt: true });
    			div10_nodes.forEach(detach_dev);
    			t10 = claim_space(div14_nodes);
    			div11 = claim_element(div14_nodes, "DIV", { class: true });
    			var div11_nodes = children(div11);
    			img9 = claim_element(div11_nodes, "IMG", { class: true, src: true, alt: true });
    			div11_nodes.forEach(detach_dev);
    			t11 = claim_space(div14_nodes);
    			div12 = claim_element(div14_nodes, "DIV", { class: true });
    			var div12_nodes = children(div12);
    			img10 = claim_element(div12_nodes, "IMG", { class: true, src: true, alt: true });
    			div12_nodes.forEach(detach_dev);
    			t12 = claim_space(div14_nodes);
    			div13 = claim_element(div14_nodes, "DIV", { class: true });
    			var div13_nodes = children(div13);
    			img11 = claim_element(div13_nodes, "IMG", { class: true, src: true, alt: true });
    			div13_nodes.forEach(detach_dev);
    			div14_nodes.forEach(detach_dev);
    			div15_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h2, "class", "svelte-10kt6q9");
    			add_location(h2, file$7, 1, 4, 40);
    			attr_dev(img0, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img0.src !== (img0_src_value = "/img/cooperative_img_1.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$7, 13, 27, 650);
    			attr_dev(div0, "class", "col-3");
    			add_location(div0, file$7, 13, 8, 631);
    			attr_dev(img1, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img1.src !== (img1_src_value = "/img/cooperative_img_2.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$7, 14, 27, 764);
    			attr_dev(div1, "class", "col-3");
    			add_location(div1, file$7, 14, 8, 745);
    			attr_dev(img2, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img2.src !== (img2_src_value = "/img/cooperative_img_3.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$7, 15, 27, 878);
    			attr_dev(div2, "class", "col-3");
    			add_location(div2, file$7, 15, 8, 859);
    			attr_dev(img3, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img3.src !== (img3_src_value = "/img/cooperative_img_4.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "");
    			add_location(img3, file$7, 16, 27, 992);
    			attr_dev(div3, "class", "col-3");
    			add_location(div3, file$7, 16, 8, 973);
    			attr_dev(div4, "class", "row justify-content-center align-items-center svelte-10kt6q9");
    			add_location(div4, file$7, 2, 4, 70);
    			attr_dev(img4, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img4.src !== (img4_src_value = "/img/cooperative_img_5.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "");
    			add_location(img4, file$7, 29, 27, 1657);
    			attr_dev(div5, "class", "col-3");
    			add_location(div5, file$7, 29, 8, 1638);
    			attr_dev(img5, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img5.src !== (img5_src_value = "/img/cooperative_img_6.png")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "");
    			add_location(img5, file$7, 30, 27, 1771);
    			attr_dev(div6, "class", "col-3");
    			add_location(div6, file$7, 30, 8, 1752);
    			attr_dev(img6, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img6.src !== (img6_src_value = "/img/cooperative_img_7.png")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "");
    			add_location(img6, file$7, 31, 27, 1885);
    			attr_dev(div7, "class", "col-3");
    			add_location(div7, file$7, 31, 8, 1866);
    			attr_dev(img7, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img7.src !== (img7_src_value = "/img/cooperative_img_8.png")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "");
    			add_location(img7, file$7, 32, 27, 1999);
    			attr_dev(div8, "class", "col-3");
    			add_location(div8, file$7, 32, 8, 1980);
    			attr_dev(div9, "class", "row justify-content-center align-items-center svelte-10kt6q9");
    			add_location(div9, file$7, 18, 4, 1095);
    			attr_dev(img8, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img8.src !== (img8_src_value = "/img/cooperative_img_9.png")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "alt", "");
    			add_location(img8, file$7, 45, 27, 2667);
    			attr_dev(div10, "class", "col-3");
    			add_location(div10, file$7, 45, 8, 2648);
    			attr_dev(img9, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img9.src !== (img9_src_value = "/img/cooperative_img_10.png")) attr_dev(img9, "src", img9_src_value);
    			attr_dev(img9, "alt", "");
    			add_location(img9, file$7, 46, 27, 2781);
    			attr_dev(div11, "class", "col-3");
    			add_location(div11, file$7, 46, 8, 2762);
    			attr_dev(img10, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img10.src !== (img10_src_value = "/img/cooperative_img_11.png")) attr_dev(img10, "src", img10_src_value);
    			attr_dev(img10, "alt", "");
    			add_location(img10, file$7, 47, 27, 2896);
    			attr_dev(div12, "class", "col-3");
    			add_location(div12, file$7, 47, 8, 2877);
    			attr_dev(img11, "class", "img-fluid mx-auto d-block svelte-10kt6q9");
    			if (img11.src !== (img11_src_value = "/img/cooperative_img_12.png")) attr_dev(img11, "src", img11_src_value);
    			attr_dev(img11, "alt", "");
    			add_location(img11, file$7, 48, 27, 3011);
    			attr_dev(div13, "class", "col-3");
    			add_location(div13, file$7, 48, 8, 2992);
    			attr_dev(div14, "class", "row justify-content-center align-items-center svelte-10kt6q9");
    			add_location(div14, file$7, 34, 4, 2102);
    			attr_dev(div15, "class", "container coop__main svelte-10kt6q9");
    			add_location(div15, file$7, 0, 0, 0);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, h2);
    			append_dev(h2, t0);
    			append_dev(div15, t1);
    			append_dev(div15, div4);
    			append_dev(div4, div0);
    			append_dev(div0, img0);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, img1);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, img2);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, img3);
    			append_dev(div15, t5);
    			append_dev(div15, div9);
    			append_dev(div9, div5);
    			append_dev(div5, img4);
    			append_dev(div9, t6);
    			append_dev(div9, div6);
    			append_dev(div6, img5);
    			append_dev(div9, t7);
    			append_dev(div9, div7);
    			append_dev(div7, img6);
    			append_dev(div9, t8);
    			append_dev(div9, div8);
    			append_dev(div8, img7);
    			append_dev(div15, t9);
    			append_dev(div15, div14);
    			append_dev(div14, div10);
    			append_dev(div10, img8);
    			append_dev(div14, t10);
    			append_dev(div14, div11);
    			append_dev(div11, img9);
    			append_dev(div14, t11);
    			append_dev(div14, div12);
    			append_dev(div12, img10);
    			append_dev(div14, t12);
    			append_dev(div14, div13);
    			append_dev(div13, img11);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Cooperative", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cooperative> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Cooperative extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cooperative",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\Sertificat.svelte generated by Svelte v3.29.7 */

    const file$8 = "src\\Sertificat.svelte";

    function create_fragment$8(ctx) {
    	let div8;
    	let div7;
    	let h2;
    	let t0;
    	let t1;
    	let div6;
    	let div1;
    	let div0;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let p0;
    	let t3;
    	let t4;
    	let div3;
    	let div2;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let p1;
    	let t6;
    	let t7;
    	let div5;
    	let div4;
    	let a2;
    	let img2;
    	let img2_src_value;
    	let t8;
    	let p2;
    	let t9;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div7 = element("div");
    			h2 = element("h2");
    			t0 = text("Лицензии и Сертификаты");
    			t1 = space();
    			div6 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t2 = space();
    			p0 = element("p");
    			t3 = text("Лицензия на право ведения образовательной деятельности");
    			t4 = space();
    			div3 = element("div");
    			div2 = element("div");
    			a1 = element("a");
    			img1 = element("img");
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Сертификат соответсвия");
    			t7 = space();
    			div5 = element("div");
    			div4 = element("div");
    			a2 = element("a");
    			img2 = element("img");
    			t8 = space();
    			p2 = element("p");
    			t9 = text("Сертификат соответсвия");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div8 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div8_nodes = children(div8);
    			div7 = claim_element(div8_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			h2 = claim_element(div7_nodes, "H2", { class: true });
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, "Лицензии и Сертификаты");
    			h2_nodes.forEach(detach_dev);
    			t1 = claim_space(div7_nodes);
    			div6 = claim_element(div7_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			div1 = claim_element(div6_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			a0 = claim_element(div0_nodes, "A", { href: true });
    			var a0_nodes = children(a0);
    			img0 = claim_element(a0_nodes, "IMG", { src: true, class: true, alt: true });
    			a0_nodes.forEach(detach_dev);
    			t2 = claim_space(div0_nodes);
    			p0 = claim_element(div0_nodes, "P", { class: true });
    			var p0_nodes = children(p0);
    			t3 = claim_text(p0_nodes, "Лицензия на право ведения образовательной деятельности");
    			p0_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			t4 = claim_space(div6_nodes);
    			div3 = claim_element(div6_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			a1 = claim_element(div2_nodes, "A", { href: true });
    			var a1_nodes = children(a1);
    			img1 = claim_element(a1_nodes, "IMG", { src: true, class: true, alt: true });
    			a1_nodes.forEach(detach_dev);
    			t5 = claim_space(div2_nodes);
    			p1 = claim_element(div2_nodes, "P", { class: true });
    			var p1_nodes = children(p1);
    			t6 = claim_text(p1_nodes, "Сертификат соответсвия");
    			p1_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			t7 = claim_space(div6_nodes);
    			div5 = claim_element(div6_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			a2 = claim_element(div4_nodes, "A", { href: true });
    			var a2_nodes = children(a2);
    			img2 = claim_element(a2_nodes, "IMG", { src: true, class: true, alt: true });
    			a2_nodes.forEach(detach_dev);
    			t8 = claim_space(div4_nodes);
    			p2 = claim_element(div4_nodes, "P", { class: true });
    			var p2_nodes = children(p2);
    			t9 = claim_text(p2_nodes, "Сертификат соответсвия");
    			p2_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			div6_nodes.forEach(detach_dev);
    			div7_nodes.forEach(detach_dev);
    			div8_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h2, "class", "svelte-19qtpl");
    			add_location(h2, file$8, 2, 8, 107);
    			if (img0.src !== (img0_src_value = "img/sertificat_img_1.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "img-fluid mx-auto d-block svelte-19qtpl");
    			attr_dev(img0, "alt", "Лицензия на право ведения образовательной деятельности");
    			add_location(img0, file$8, 6, 68, 374);
    			attr_dev(a0, "href", "https://uprav.ru/about/#lg=1&slide=15");
    			add_location(a0, file$8, 6, 20, 326);
    			attr_dev(p0, "class", "svelte-19qtpl");
    			add_location(p0, file$8, 7, 20, 531);
    			attr_dev(div0, "class", "first__sertificat sertificat svelte-19qtpl");
    			add_location(div0, file$8, 5, 16, 262);
    			attr_dev(div1, "class", "col-sm-12 col-md-12 col-lg-4");
    			add_location(div1, file$8, 4, 12, 202);
    			if (img1.src !== (img1_src_value = "img/sertificat_img_2.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "img-fluid mx-auto d-block svelte-19qtpl");
    			attr_dev(img1, "alt", "Сертификат соответсвия");
    			add_location(img1, file$8, 14, 67, 870);
    			attr_dev(a1, "href", "https://uprav.ru/about/#lg=1&slide=0");
    			add_location(a1, file$8, 14, 20, 823);
    			attr_dev(p1, "class", "svelte-19qtpl");
    			add_location(p1, file$8, 15, 20, 995);
    			attr_dev(div2, "class", "second__sertificat sertificat svelte-19qtpl");
    			add_location(div2, file$8, 13, 16, 758);
    			attr_dev(div3, "class", "col-sm-12 col-md-12 col-lg-4");
    			add_location(div3, file$8, 12, 12, 698);
    			if (img2.src !== (img2_src_value = "img/sertificat_img_3.jpg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "class", "img-fluid mx-auto d-block svelte-19qtpl");
    			attr_dev(img2, "alt", "Сертификат соответсвия");
    			add_location(img2, file$8, 22, 67, 1301);
    			attr_dev(a2, "href", "https://uprav.ru/about/#lg=1&slide=1");
    			add_location(a2, file$8, 22, 20, 1254);
    			attr_dev(p2, "class", "svelte-19qtpl");
    			add_location(p2, file$8, 23, 20, 1426);
    			attr_dev(div4, "class", "first__sertificat sertificat svelte-19qtpl");
    			add_location(div4, file$8, 21, 16, 1190);
    			attr_dev(div5, "class", "col-sm-12 col-md-12 col-lg-4");
    			add_location(div5, file$8, 20, 12, 1130);
    			attr_dev(div6, "class", "row justify-content-center");
    			add_location(div6, file$8, 3, 8, 148);
    			attr_dev(div7, "class", "container");
    			add_location(div7, file$8, 1, 4, 74);
    			attr_dev(div8, "class", "container-fluid sertificat__container svelte-19qtpl");
    			attr_dev(div8, "id", "sertificats");
    			add_location(div8, file$8, 0, 0, 0);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, h2);
    			append_dev(h2, t0);
    			append_dev(div7, t1);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img0);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(p0, t3);
    			append_dev(div6, t4);
    			append_dev(div6, div3);
    			append_dev(div3, div2);
    			append_dev(div2, a1);
    			append_dev(a1, img1);
    			append_dev(div2, t5);
    			append_dev(div2, p1);
    			append_dev(p1, t6);
    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, a2);
    			append_dev(a2, img2);
    			append_dev(div4, t8);
    			append_dev(div4, p2);
    			append_dev(p2, t9);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sertificat", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sertificat> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Sertificat extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sertificat",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\FormFooter.svelte generated by Svelte v3.29.7 */

    const file$9 = "src\\FormFooter.svelte";

    function create_fragment$9(ctx) {
    	let div9;
    	let div8;
    	let div7;
    	let div1;
    	let div0;
    	let p;
    	let t0;
    	let t1;
    	let div6;
    	let form;
    	let div5;
    	let div4;
    	let div2;
    	let input0;
    	let t2;
    	let div3;
    	let input1;
    	let t3;
    	let input2;
    	let t4;
    	let label;
    	let input3;
    	let t5;
    	let span0;
    	let t6;
    	let span1;
    	let t7;
    	let a;
    	let t8;
    	let t9;
    	let button;
    	let t10;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text("Получите временный доступ к личному кабинету, чтобы ознакомиться со всеми тонкостями процесса\r\n                        обучения, образовательными программами и внутренним устройством");
    			t1 = space();
    			div6 = element("div");
    			form = element("form");
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div3 = element("div");
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			label = element("label");
    			input3 = element("input");
    			t5 = space();
    			span0 = element("span");
    			t6 = space();
    			span1 = element("span");
    			t7 = text("Я согласен с ");
    			a = element("a");
    			t8 = text("политикой конфиденциальности");
    			t9 = space();
    			button = element("button");
    			t10 = text("Отправить");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div9 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div9_nodes = children(div9);
    			div8 = claim_element(div9_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);
    			div7 = claim_element(div8_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			div1 = claim_element(div7_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			p = claim_element(div0_nodes, "P", { class: true });
    			var p_nodes = children(p);
    			t0 = claim_text(p_nodes, "Получите временный доступ к личному кабинету, чтобы ознакомиться со всеми тонкостями процесса\r\n                        обучения, образовательными программами и внутренним устройством");
    			p_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			t1 = claim_space(div7_nodes);
    			div6 = claim_element(div7_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			form = claim_element(div6_nodes, "FORM", { action: true, method: true, class: true });
    			var form_nodes = children(form);
    			div5 = claim_element(form_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			div2 = claim_element(div4_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);

    			input0 = claim_element(div2_nodes, "INPUT", {
    				type: true,
    				name: true,
    				class: true,
    				placeholder: true,
    				required: true
    			});

    			div2_nodes.forEach(detach_dev);
    			t2 = claim_space(div4_nodes);
    			div3 = claim_element(div4_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);

    			input1 = claim_element(div3_nodes, "INPUT", {
    				name: true,
    				id: true,
    				class: true,
    				placeholder: true,
    				required: true
    			});

    			div3_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			t3 = claim_space(div5_nodes);

    			input2 = claim_element(div5_nodes, "INPUT", {
    				type: true,
    				class: true,
    				name: true,
    				placeholder: true,
    				required: true
    			});

    			t4 = claim_space(div5_nodes);
    			label = claim_element(div5_nodes, "LABEL", { class: true });
    			var label_nodes = children(label);
    			input3 = claim_element(label_nodes, "INPUT", { type: true, class: true });
    			t5 = claim_space(label_nodes);
    			span0 = claim_element(label_nodes, "SPAN", { class: true });
    			children(span0).forEach(detach_dev);
    			t6 = claim_space(label_nodes);
    			span1 = claim_element(label_nodes, "SPAN", { class: true });
    			var span1_nodes = children(span1);
    			t7 = claim_text(span1_nodes, "Я согласен с ");
    			a = claim_element(span1_nodes, "A", { href: true, target: true, class: true });
    			var a_nodes = children(a);
    			t8 = claim_text(a_nodes, "политикой конфиденциальности");
    			a_nodes.forEach(detach_dev);
    			span1_nodes.forEach(detach_dev);
    			label_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			t9 = claim_space(form_nodes);
    			button = claim_element(form_nodes, "BUTTON", { class: true, disabled: true, type: true });
    			var button_nodes = children(button);
    			t10 = claim_text(button_nodes, "Отправить");
    			button_nodes.forEach(detach_dev);
    			form_nodes.forEach(detach_dev);
    			div6_nodes.forEach(detach_dev);
    			div7_nodes.forEach(detach_dev);
    			div8_nodes.forEach(detach_dev);
    			div9_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(p, "class", "text-block_content svelte-c9midr");
    			add_location(p, file$9, 9, 20, 260);
    			attr_dev(div0, "class", "text-block svelte-c9midr");
    			add_location(div0, file$9, 8, 16, 214);
    			attr_dev(div1, "class", "col-xl-7");
    			add_location(div1, file$9, 7, 12, 174);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "name");
    			attr_dev(input0, "class", "form-control form__name svelte-c9midr");
    			attr_dev(input0, "placeholder", "Ваше имя");
    			input0.required = true;
    			add_location(input0, file$9, 20, 32, 873);
    			attr_dev(div2, "class", "col-xl-6");
    			add_location(div2, file$9, 19, 28, 817);
    			attr_dev(input1, "name", "phone");
    			attr_dev(input1, "id", "tel");
    			attr_dev(input1, "class", "form-control form__send__number svelte-c9midr");
    			attr_dev(input1, "placeholder", "Ваш телефон");
    			input1.required = true;
    			add_location(input1, file$9, 23, 32, 1090);
    			attr_dev(div3, "class", "col-xl-6");
    			add_location(div3, file$9, 22, 28, 1034);
    			attr_dev(div4, "class", "row align-items-center");
    			add_location(div4, file$9, 18, 24, 751);
    			attr_dev(input2, "type", "email");
    			attr_dev(input2, "class", "form-control form_send__email svelte-c9midr");
    			attr_dev(input2, "name", "email");
    			attr_dev(input2, "placeholder", "Ваш электронный адрес");
    			input2.required = true;
    			add_location(input2, file$9, 26, 24, 1288);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "class", "checkbox svelte-c9midr");
    			add_location(input3, file$9, 29, 28, 1510);
    			attr_dev(span0, "class", "fake svelte-c9midr");
    			add_location(span0, file$9, 30, 28, 1599);
    			attr_dev(a, "href", "/img/politika_peda.pdf");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "link svelte-c9midr");
    			add_location(a, file$9, 31, 57, 1684);
    			attr_dev(span1, "class", "p svelte-c9midr");
    			add_location(span1, file$9, 31, 28, 1655);
    			attr_dev(label, "class", "label svelte-c9midr");
    			add_location(label, file$9, 28, 24, 1459);
    			attr_dev(div5, "class", "form-block");
    			add_location(div5, file$9, 17, 20, 701);
    			attr_dev(button, "class", "form__btn svelte-c9midr");
    			button.disabled = button_disabled_value = !/*yes*/ ctx[0];
    			attr_dev(button, "type", "submit");
    			add_location(button, file$9, 34, 20, 1870);
    			attr_dev(form, "action", "send.php");
    			attr_dev(form, "method", "POST");
    			attr_dev(form, "class", "form__send");
    			add_location(form, file$9, 16, 16, 622);
    			attr_dev(div6, "class", "col-xl-5");
    			add_location(div6, file$9, 15, 12, 582);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$9, 6, 8, 143);
    			attr_dev(div8, "class", "container");
    			add_location(div8, file$9, 5, 4, 110);
    			attr_dev(div9, "class", "form-container form__footer svelte-c9midr");
    			attr_dev(div9, "id", "connect_form");
    			add_location(div9, file$9, 4, 0, 45);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div7, t1);
    			append_dev(div7, div6);
    			append_dev(div6, form);
    			append_dev(form, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, input0);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, input1);
    			append_dev(div5, t3);
    			append_dev(div5, input2);
    			append_dev(div5, t4);
    			append_dev(div5, label);
    			append_dev(label, input3);
    			input3.checked = /*yes*/ ctx[0];
    			append_dev(label, t5);
    			append_dev(label, span0);
    			append_dev(label, t6);
    			append_dev(label, span1);
    			append_dev(span1, t7);
    			append_dev(span1, a);
    			append_dev(a, t8);
    			append_dev(form, t9);
    			append_dev(form, button);
    			append_dev(button, t10);

    			if (!mounted) {
    				dispose = listen_dev(input3, "change", /*input3_change_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*yes*/ 1) {
    				input3.checked = /*yes*/ ctx[0];
    			}

    			if (dirty & /*yes*/ 1 && button_disabled_value !== (button_disabled_value = !/*yes*/ ctx[0])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FormFooter", slots, []);
    	let yes = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FormFooter> was created with unknown prop '${key}'`);
    	});

    	function input3_change_handler() {
    		yes = this.checked;
    		$$invalidate(0, yes);
    	}

    	$$self.$capture_state = () => ({ yes });

    	$$self.$inject_state = $$props => {
    		if ("yes" in $$props) $$invalidate(0, yes = $$props.yes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [yes, input3_change_handler];
    }

    class FormFooter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormFooter",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\Footer.svelte generated by Svelte v3.29.7 */

    const file$a = "src\\Footer.svelte";

    function create_fragment$a(ctx) {
    	let div15;
    	let div14;
    	let div3;
    	let div0;
    	let nav;
    	let li0;
    	let a0;
    	let t0;
    	let t1;
    	let li1;
    	let a1;
    	let t2;
    	let t3;
    	let li2;
    	let a2;
    	let t4;
    	let t5;
    	let li3;
    	let a3;
    	let t6;
    	let t7;
    	let li4;
    	let a4;
    	let t8;
    	let t9;
    	let li5;
    	let a5;
    	let t10;
    	let t11;
    	let li6;
    	let a6;
    	let t12;
    	let t13;
    	let div2;
    	let div1;
    	let span0;
    	let t14;
    	let t15;
    	let span1;
    	let t16;
    	let br0;
    	let t17;
    	let br1;
    	let t18;
    	let a7;
    	let t19;
    	let t20;
    	let div13;
    	let div9;
    	let div8;
    	let div7;
    	let div4;
    	let span2;
    	let t21;
    	let t22;
    	let div5;
    	let span3;
    	let t23;
    	let t24;
    	let div6;
    	let span4;
    	let a8;
    	let t25;
    	let t26;
    	let div12;
    	let div11;
    	let div10;
    	let span5;
    	let t27;
    	let t28;
    	let ul;
    	let li7;
    	let a9;
    	let t29;
    	let li8;
    	let a10;
    	let t30;
    	let li9;
    	let a11;
    	let t31;
    	let li10;
    	let a12;
    	let t32;
    	let li11;
    	let a13;

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			div14 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			nav = element("nav");
    			li0 = element("li");
    			a0 = element("a");
    			t0 = text("О проекте");
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			t2 = text("Вы получите");
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			t4 = text("Подключиться");
    			t5 = space();
    			li3 = element("li");
    			a3 = element("a");
    			t6 = text("Тарифы");
    			t7 = space();
    			li4 = element("li");
    			a4 = element("a");
    			t8 = text("Преимущества");
    			t9 = space();
    			li5 = element("li");
    			a5 = element("a");
    			t10 = text("Лицензии");
    			t11 = space();
    			li6 = element("li");
    			a6 = element("a");
    			t12 = text("Контакты");
    			t13 = space();
    			div2 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			t14 = text("Контакты");
    			t15 = space();
    			span1 = element("span");
    			t16 = text("г. Москва, м.Ботанический сад/м.ВДНХ, ");
    			br0 = element("br");
    			t17 = text("\r\n                        ул. Сельскохозяйственная, д.17/5 ");
    			br1 = element("br");
    			t18 = text("\r\n                        тел.: ");
    			a7 = element("a");
    			t19 = text("+7(495) 980-57-28");
    			t20 = space();
    			div13 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div4 = element("div");
    			span2 = element("span");
    			t21 = text("© Русская Школа Управления, 2002-2020. Все права защищены и\r\n                                охраняются законом.\r\n                                Все содержание курсов обучения, семинаров, тренингов, представленных на сайте\r\n                                www.uprav.ru, является уникальным и принадлежит РШУ.");
    			t22 = space();
    			div5 = element("div");
    			span3 = element("span");
    			t23 = text("Лицензия на образовательную деятельность № 029045, № 040697");
    			t24 = space();
    			div6 = element("div");
    			span4 = element("span");
    			a8 = element("a");
    			t25 = text("Политика конфиденциальности");
    			t26 = space();
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			span5 = element("span");
    			t27 = text("Мы в соцсетях");
    			t28 = space();
    			ul = element("ul");
    			li7 = element("li");
    			a9 = element("a");
    			t29 = space();
    			li8 = element("li");
    			a10 = element("a");
    			t30 = space();
    			li9 = element("li");
    			a11 = element("a");
    			t31 = space();
    			li10 = element("li");
    			a12 = element("a");
    			t32 = space();
    			li11 = element("li");
    			a13 = element("a");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div15 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div15_nodes = children(div15);
    			div14 = claim_element(div15_nodes, "DIV", { class: true });
    			var div14_nodes = children(div14);
    			div3 = claim_element(div14_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div0 = claim_element(div3_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			nav = claim_element(div0_nodes, "NAV", { class: true });
    			var nav_nodes = children(nav);
    			li0 = claim_element(nav_nodes, "LI", { class: true });
    			var li0_nodes = children(li0);
    			a0 = claim_element(li0_nodes, "A", { href: true, class: true });
    			var a0_nodes = children(a0);
    			t0 = claim_text(a0_nodes, "О проекте");
    			a0_nodes.forEach(detach_dev);
    			li0_nodes.forEach(detach_dev);
    			t1 = claim_space(nav_nodes);
    			li1 = claim_element(nav_nodes, "LI", { class: true });
    			var li1_nodes = children(li1);
    			a1 = claim_element(li1_nodes, "A", { href: true, class: true });
    			var a1_nodes = children(a1);
    			t2 = claim_text(a1_nodes, "Вы получите");
    			a1_nodes.forEach(detach_dev);
    			li1_nodes.forEach(detach_dev);
    			t3 = claim_space(nav_nodes);
    			li2 = claim_element(nav_nodes, "LI", { class: true });
    			var li2_nodes = children(li2);
    			a2 = claim_element(li2_nodes, "A", { href: true, class: true });
    			var a2_nodes = children(a2);
    			t4 = claim_text(a2_nodes, "Подключиться");
    			a2_nodes.forEach(detach_dev);
    			li2_nodes.forEach(detach_dev);
    			t5 = claim_space(nav_nodes);
    			li3 = claim_element(nav_nodes, "LI", { class: true });
    			var li3_nodes = children(li3);
    			a3 = claim_element(li3_nodes, "A", { href: true, class: true });
    			var a3_nodes = children(a3);
    			t6 = claim_text(a3_nodes, "Тарифы");
    			a3_nodes.forEach(detach_dev);
    			li3_nodes.forEach(detach_dev);
    			t7 = claim_space(nav_nodes);
    			li4 = claim_element(nav_nodes, "LI", { class: true });
    			var li4_nodes = children(li4);
    			a4 = claim_element(li4_nodes, "A", { href: true, class: true });
    			var a4_nodes = children(a4);
    			t8 = claim_text(a4_nodes, "Преимущества");
    			a4_nodes.forEach(detach_dev);
    			li4_nodes.forEach(detach_dev);
    			t9 = claim_space(nav_nodes);
    			li5 = claim_element(nav_nodes, "LI", { class: true });
    			var li5_nodes = children(li5);
    			a5 = claim_element(li5_nodes, "A", { href: true, class: true });
    			var a5_nodes = children(a5);
    			t10 = claim_text(a5_nodes, "Лицензии");
    			a5_nodes.forEach(detach_dev);
    			li5_nodes.forEach(detach_dev);
    			t11 = claim_space(nav_nodes);
    			li6 = claim_element(nav_nodes, "LI", { class: true });
    			var li6_nodes = children(li6);
    			a6 = claim_element(li6_nodes, "A", { href: true, class: true });
    			var a6_nodes = children(a6);
    			t12 = claim_text(a6_nodes, "Контакты");
    			a6_nodes.forEach(detach_dev);
    			li6_nodes.forEach(detach_dev);
    			nav_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			t13 = claim_space(div3_nodes);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			div1 = claim_element(div2_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			span0 = claim_element(div1_nodes, "SPAN", { class: true });
    			var span0_nodes = children(span0);
    			t14 = claim_text(span0_nodes, "Контакты");
    			span0_nodes.forEach(detach_dev);
    			t15 = claim_space(div1_nodes);
    			span1 = claim_element(div1_nodes, "SPAN", { class: true });
    			var span1_nodes = children(span1);
    			t16 = claim_text(span1_nodes, "г. Москва, м.Ботанический сад/м.ВДНХ, ");
    			br0 = claim_element(span1_nodes, "BR", {});
    			t17 = claim_text(span1_nodes, "\r\n                        ул. Сельскохозяйственная, д.17/5 ");
    			br1 = claim_element(span1_nodes, "BR", {});
    			t18 = claim_text(span1_nodes, "\r\n                        тел.: ");
    			a7 = claim_element(span1_nodes, "A", { href: true, class: true });
    			var a7_nodes = children(a7);
    			t19 = claim_text(a7_nodes, "+7(495) 980-57-28");
    			a7_nodes.forEach(detach_dev);
    			span1_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			t20 = claim_space(div14_nodes);
    			div13 = claim_element(div14_nodes, "DIV", { class: true });
    			var div13_nodes = children(div13);
    			div9 = claim_element(div13_nodes, "DIV", { class: true });
    			var div9_nodes = children(div9);
    			div8 = claim_element(div9_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);
    			div7 = claim_element(div8_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			div4 = claim_element(div7_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			span2 = claim_element(div4_nodes, "SPAN", { class: true });
    			var span2_nodes = children(span2);
    			t21 = claim_text(span2_nodes, "© Русская Школа Управления, 2002-2020. Все права защищены и\r\n                                охраняются законом.\r\n                                Все содержание курсов обучения, семинаров, тренингов, представленных на сайте\r\n                                www.uprav.ru, является уникальным и принадлежит РШУ.");
    			span2_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			t22 = claim_space(div7_nodes);
    			div5 = claim_element(div7_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			span3 = claim_element(div5_nodes, "SPAN", { class: true });
    			var span3_nodes = children(span3);
    			t23 = claim_text(span3_nodes, "Лицензия на образовательную деятельность № 029045, № 040697");
    			span3_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			t24 = claim_space(div7_nodes);
    			div6 = claim_element(div7_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			span4 = claim_element(div6_nodes, "SPAN", { class: true });
    			var span4_nodes = children(span4);
    			a8 = claim_element(span4_nodes, "A", { href: true, target: true, class: true });
    			var a8_nodes = children(a8);
    			t25 = claim_text(a8_nodes, "Политика конфиденциальности");
    			a8_nodes.forEach(detach_dev);
    			span4_nodes.forEach(detach_dev);
    			div6_nodes.forEach(detach_dev);
    			div7_nodes.forEach(detach_dev);
    			div8_nodes.forEach(detach_dev);
    			div9_nodes.forEach(detach_dev);
    			t26 = claim_space(div13_nodes);
    			div12 = claim_element(div13_nodes, "DIV", { class: true });
    			var div12_nodes = children(div12);
    			div11 = claim_element(div12_nodes, "DIV", { class: true });
    			var div11_nodes = children(div11);
    			div10 = claim_element(div11_nodes, "DIV", { class: true });
    			var div10_nodes = children(div10);
    			span5 = claim_element(div10_nodes, "SPAN", { class: true });
    			var span5_nodes = children(span5);
    			t27 = claim_text(span5_nodes, "Мы в соцсетях");
    			span5_nodes.forEach(detach_dev);
    			div10_nodes.forEach(detach_dev);
    			t28 = claim_space(div11_nodes);
    			ul = claim_element(div11_nodes, "UL", { class: true });
    			var ul_nodes = children(ul);
    			li7 = claim_element(ul_nodes, "LI", { class: true });
    			var li7_nodes = children(li7);
    			a9 = claim_element(li7_nodes, "A", { class: true, href: true, target: true });
    			children(a9).forEach(detach_dev);
    			li7_nodes.forEach(detach_dev);
    			t29 = claim_space(ul_nodes);
    			li8 = claim_element(ul_nodes, "LI", { class: true });
    			var li8_nodes = children(li8);
    			a10 = claim_element(li8_nodes, "A", { class: true, href: true, target: true });
    			children(a10).forEach(detach_dev);
    			li8_nodes.forEach(detach_dev);
    			t30 = claim_space(ul_nodes);
    			li9 = claim_element(ul_nodes, "LI", { class: true });
    			var li9_nodes = children(li9);
    			a11 = claim_element(li9_nodes, "A", { class: true, href: true, target: true });
    			children(a11).forEach(detach_dev);
    			li9_nodes.forEach(detach_dev);
    			t31 = claim_space(ul_nodes);
    			li10 = claim_element(ul_nodes, "LI", { class: true });
    			var li10_nodes = children(li10);
    			a12 = claim_element(li10_nodes, "A", { class: true, href: true, target: true });
    			children(a12).forEach(detach_dev);
    			li10_nodes.forEach(detach_dev);
    			t32 = claim_space(ul_nodes);
    			li11 = claim_element(ul_nodes, "LI", { class: true });
    			var li11_nodes = children(li11);
    			a13 = claim_element(li11_nodes, "A", { class: true, href: true, target: true });
    			children(a13).forEach(detach_dev);
    			li11_nodes.forEach(detach_dev);
    			ul_nodes.forEach(detach_dev);
    			div11_nodes.forEach(detach_dev);
    			div12_nodes.forEach(detach_dev);
    			div13_nodes.forEach(detach_dev);
    			div14_nodes.forEach(detach_dev);
    			div15_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(a0, "href", "#about_Us");
    			attr_dev(a0, "class", "svelte-1iglaoq");
    			add_location(a0, file$a, 5, 41, 329);
    			attr_dev(li0, "class", "nav_item svelte-1iglaoq");
    			add_location(li0, file$a, 5, 20, 308);
    			attr_dev(a1, "href", "#youGet");
    			attr_dev(a1, "class", "svelte-1iglaoq");
    			add_location(a1, file$a, 6, 41, 410);
    			attr_dev(li1, "class", "nav_item svelte-1iglaoq");
    			add_location(li1, file$a, 6, 20, 389);
    			attr_dev(a2, "href", "#connect_us");
    			attr_dev(a2, "class", "svelte-1iglaoq");
    			add_location(a2, file$a, 7, 41, 491);
    			attr_dev(li2, "class", "nav_item svelte-1iglaoq");
    			add_location(li2, file$a, 7, 20, 470);
    			attr_dev(a3, "href", "#price");
    			attr_dev(a3, "class", "svelte-1iglaoq");
    			add_location(a3, file$a, 8, 41, 577);
    			attr_dev(li3, "class", "nav_item svelte-1iglaoq");
    			add_location(li3, file$a, 8, 20, 556);
    			attr_dev(a4, "href", "#advantage");
    			attr_dev(a4, "class", "svelte-1iglaoq");
    			add_location(a4, file$a, 9, 41, 652);
    			attr_dev(li4, "class", "nav_item svelte-1iglaoq");
    			add_location(li4, file$a, 9, 20, 631);
    			attr_dev(a5, "href", "#sertificats");
    			attr_dev(a5, "class", "svelte-1iglaoq");
    			add_location(a5, file$a, 10, 41, 737);
    			attr_dev(li5, "class", "nav_item svelte-1iglaoq");
    			add_location(li5, file$a, 10, 20, 716);
    			attr_dev(a6, "href", "#contacts");
    			attr_dev(a6, "class", "svelte-1iglaoq");
    			add_location(a6, file$a, 11, 41, 820);
    			attr_dev(li6, "class", "nav_item svelte-1iglaoq");
    			add_location(li6, file$a, 11, 20, 799);
    			attr_dev(nav, "class", "nav_footer navbar justify-content-center  svelte-1iglaoq");
    			add_location(nav, file$a, 4, 16, 231);
    			attr_dev(div0, "class", "col-xl-7 col-xs-12 col-md-6 col-lg-8");
    			add_location(div0, file$a, 3, 12, 163);
    			attr_dev(span0, "class", "title svelte-1iglaoq");
    			add_location(span0, file$a, 16, 20, 1033);
    			add_location(br0, file$a, 19, 77, 1195);
    			add_location(br1, file$a, 20, 57, 1258);
    			attr_dev(a7, "href", "tel:+74959805728");
    			attr_dev(a7, "class", "desc_number svelte-1iglaoq");
    			add_location(a7, file$a, 21, 30, 1294);
    			attr_dev(span1, "class", "desc svelte-1iglaoq");
    			add_location(span1, file$a, 19, 20, 1138);
    			attr_dev(div1, "class", "contacts_block svelte-1iglaoq");
    			add_location(div1, file$a, 15, 16, 983);
    			attr_dev(div2, "class", "col-xl-3 col-xs-12 col-md-6 col-lg-4");
    			add_location(div2, file$a, 14, 12, 915);
    			attr_dev(div3, "class", "row justify-content-between align-items-center");
    			add_location(div3, file$a, 2, 8, 89);
    			attr_dev(span2, "class", "first__stroke_text svelte-1iglaoq");
    			add_location(span2, file$a, 31, 28, 1802);
    			attr_dev(div4, "class", "first__stroke svelte-1iglaoq");
    			add_location(div4, file$a, 30, 24, 1745);
    			attr_dev(span3, "class", "licenses svelte-1iglaoq");
    			add_location(span3, file$a, 38, 28, 2296);
    			attr_dev(div5, "class", "second-stroke svelte-1iglaoq");
    			add_location(div5, file$a, 37, 24, 2239);
    			attr_dev(a8, "href", "/img/politika_peda.pdf");
    			attr_dev(a8, "target", "_blank");
    			attr_dev(a8, "class", "svelte-1iglaoq");
    			add_location(a8, file$a, 43, 56, 2587);
    			attr_dev(span4, "class", "politics_text svelte-1iglaoq");
    			add_location(span4, file$a, 43, 28, 2559);
    			attr_dev(div6, "class", "politics svelte-1iglaoq");
    			add_location(div6, file$a, 42, 24, 2507);
    			attr_dev(div7, "class", "about_block__content");
    			add_location(div7, file$a, 29, 20, 1685);
    			attr_dev(div8, "class", "about_block");
    			add_location(div8, file$a, 27, 16, 1534);
    			attr_dev(div9, "class", "col-xl-6");
    			add_location(div9, file$a, 26, 12, 1494);
    			attr_dev(span5, "class", "social_title__text svelte-1iglaoq");
    			add_location(span5, file$a, 51, 24, 2927);
    			attr_dev(div10, "class", "social_title");
    			add_location(div10, file$a, 50, 20, 2875);
    			attr_dev(a9, "class", "fb__icon svelte-1iglaoq");
    			attr_dev(a9, "href", "https://www.facebook.com/uprav");
    			attr_dev(a9, "target", "_blank");
    			add_location(a9, file$a, 56, 28, 3141);
    			attr_dev(li7, "class", "svelte-1iglaoq");
    			add_location(li7, file$a, 56, 24, 3137);
    			attr_dev(a10, "class", "vk__icon svelte-1iglaoq");
    			attr_dev(a10, "href", "https://vk.com/rusuprav");
    			attr_dev(a10, "target", "_blank");
    			add_location(a10, file$a, 57, 28, 3254);
    			attr_dev(li8, "class", "svelte-1iglaoq");
    			add_location(li8, file$a, 57, 24, 3250);
    			attr_dev(a11, "class", "inst__icon svelte-1iglaoq");
    			attr_dev(a11, "href", "https://www.instagram.com/rusuprav/");
    			attr_dev(a11, "target", "_blank");
    			add_location(a11, file$a, 58, 28, 3360);
    			attr_dev(li9, "class", "svelte-1iglaoq");
    			add_location(li9, file$a, 58, 24, 3356);
    			attr_dev(a12, "class", "yt__icon svelte-1iglaoq");
    			attr_dev(a12, "href", "https://www.youtube.com/user/TheRSManagement");
    			attr_dev(a12, "target", "_blank");
    			add_location(a12, file$a, 59, 28, 3480);
    			attr_dev(li10, "class", "svelte-1iglaoq");
    			add_location(li10, file$a, 59, 24, 3476);
    			attr_dev(a13, "class", "tg__icon svelte-1iglaoq");
    			attr_dev(a13, "href", " https://web.telegram.org/#/im?p=@rusuprav");
    			attr_dev(a13, "target", "_blank");
    			add_location(a13, file$a, 60, 28, 3607);
    			attr_dev(li11, "class", "svelte-1iglaoq");
    			add_location(li11, file$a, 60, 24, 3603);
    			attr_dev(ul, "class", "social__icon svelte-1iglaoq");
    			add_location(ul, file$a, 55, 20, 3086);
    			attr_dev(div11, "class", "social svelte-1iglaoq");
    			add_location(div11, file$a, 49, 16, 2833);
    			attr_dev(div12, "class", "col-xl-3");
    			add_location(div12, file$a, 48, 12, 2793);
    			attr_dev(div13, "class", "row justify-content-between");
    			add_location(div13, file$a, 25, 8, 1439);
    			attr_dev(div14, "class", "container-fluid");
    			add_location(div14, file$a, 1, 4, 50);
    			attr_dev(div15, "class", "footer_container svelte-1iglaoq");
    			attr_dev(div15, "id", "contacts");
    			add_location(div15, file$a, 0, 0, 0);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, div14);
    			append_dev(div14, div3);
    			append_dev(div3, div0);
    			append_dev(div0, nav);
    			append_dev(nav, li0);
    			append_dev(li0, a0);
    			append_dev(a0, t0);
    			append_dev(nav, t1);
    			append_dev(nav, li1);
    			append_dev(li1, a1);
    			append_dev(a1, t2);
    			append_dev(nav, t3);
    			append_dev(nav, li2);
    			append_dev(li2, a2);
    			append_dev(a2, t4);
    			append_dev(nav, t5);
    			append_dev(nav, li3);
    			append_dev(li3, a3);
    			append_dev(a3, t6);
    			append_dev(nav, t7);
    			append_dev(nav, li4);
    			append_dev(li4, a4);
    			append_dev(a4, t8);
    			append_dev(nav, t9);
    			append_dev(nav, li5);
    			append_dev(li5, a5);
    			append_dev(a5, t10);
    			append_dev(nav, t11);
    			append_dev(nav, li6);
    			append_dev(li6, a6);
    			append_dev(a6, t12);
    			append_dev(div3, t13);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(span0, t14);
    			append_dev(div1, t15);
    			append_dev(div1, span1);
    			append_dev(span1, t16);
    			append_dev(span1, br0);
    			append_dev(span1, t17);
    			append_dev(span1, br1);
    			append_dev(span1, t18);
    			append_dev(span1, a7);
    			append_dev(a7, t19);
    			append_dev(div14, t20);
    			append_dev(div14, div13);
    			append_dev(div13, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div4);
    			append_dev(div4, span2);
    			append_dev(span2, t21);
    			append_dev(div7, t22);
    			append_dev(div7, div5);
    			append_dev(div5, span3);
    			append_dev(span3, t23);
    			append_dev(div7, t24);
    			append_dev(div7, div6);
    			append_dev(div6, span4);
    			append_dev(span4, a8);
    			append_dev(a8, t25);
    			append_dev(div13, t26);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, span5);
    			append_dev(span5, t27);
    			append_dev(div11, t28);
    			append_dev(div11, ul);
    			append_dev(ul, li7);
    			append_dev(li7, a9);
    			append_dev(ul, t29);
    			append_dev(ul, li8);
    			append_dev(li8, a10);
    			append_dev(ul, t30);
    			append_dev(ul, li9);
    			append_dev(li9, a11);
    			append_dev(ul, t31);
    			append_dev(ul, li10);
    			append_dev(li10, a12);
    			append_dev(ul, t32);
    			append_dev(ul, li11);
    			append_dev(li11, a13);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\ModalPopup.svelte generated by Svelte v3.29.7 */

    const file$b = "src\\ModalPopup.svelte";

    function create_fragment$b(ctx) {
    	let div15;
    	let div14;
    	let div13;
    	let div0;
    	let h50;
    	let t0;
    	let t1;
    	let button0;
    	let span0;
    	let t2;
    	let form0;
    	let div9;
    	let div2;
    	let div1;
    	let p0;
    	let t3;
    	let t4;
    	let div5;
    	let div3;
    	let input0;
    	let t5;
    	let div4;
    	let input1;
    	let t6;
    	let div8;
    	let div6;
    	let input2;
    	let t7;
    	let div7;
    	let input3;
    	let t8;
    	let div12;
    	let div11;
    	let div10;
    	let button1;
    	let t9;
    	let t10;
    	let div31;
    	let div30;
    	let div29;
    	let div16;
    	let h51;
    	let t11;
    	let t12;
    	let button2;
    	let span1;
    	let t13;
    	let form1;
    	let div25;
    	let div18;
    	let div17;
    	let p1;
    	let t14;
    	let t15;
    	let div21;
    	let div19;
    	let input4;
    	let t16;
    	let div20;
    	let input5;
    	let t17;
    	let div24;
    	let div22;
    	let input6;
    	let t18;
    	let div23;
    	let input7;
    	let t19;
    	let div28;
    	let div27;
    	let div26;
    	let button3;
    	let t20;

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			div14 = element("div");
    			div13 = element("div");
    			div0 = element("div");
    			h50 = element("h5");
    			t0 = text("Форма обратной свзяи");
    			t1 = space();
    			button0 = element("button");
    			span0 = element("span");
    			t2 = space();
    			form0 = element("form");
    			div9 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			t3 = text("Мы свяжемся с вами в течении 15 минут! Ждите звонка");
    			t4 = space();
    			div5 = element("div");
    			div3 = element("div");
    			input0 = element("input");
    			t5 = space();
    			div4 = element("div");
    			input1 = element("input");
    			t6 = space();
    			div8 = element("div");
    			div6 = element("div");
    			input2 = element("input");
    			t7 = space();
    			div7 = element("div");
    			input3 = element("input");
    			t8 = space();
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			button1 = element("button");
    			t9 = text("Отправить заявку");
    			t10 = space();
    			div31 = element("div");
    			div30 = element("div");
    			div29 = element("div");
    			div16 = element("div");
    			h51 = element("h5");
    			t11 = text("Форма обратной свзяи");
    			t12 = space();
    			button2 = element("button");
    			span1 = element("span");
    			t13 = space();
    			form1 = element("form");
    			div25 = element("div");
    			div18 = element("div");
    			div17 = element("div");
    			p1 = element("p");
    			t14 = text("Мы свяжемся с вами в течении 15 минут! Ждите звонка");
    			t15 = space();
    			div21 = element("div");
    			div19 = element("div");
    			input4 = element("input");
    			t16 = space();
    			div20 = element("div");
    			input5 = element("input");
    			t17 = space();
    			div24 = element("div");
    			div22 = element("div");
    			input6 = element("input");
    			t18 = space();
    			div23 = element("div");
    			input7 = element("input");
    			t19 = space();
    			div28 = element("div");
    			div27 = element("div");
    			div26 = element("div");
    			button3 = element("button");
    			t20 = text("Отправить заявку");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div15 = claim_element(nodes, "DIV", {
    				class: true,
    				id: true,
    				tabindex: true,
    				"aria-labelledby": true,
    				"aria-hidden": true
    			});

    			var div15_nodes = children(div15);
    			div14 = claim_element(div15_nodes, "DIV", { class: true });
    			var div14_nodes = children(div14);
    			div13 = claim_element(div14_nodes, "DIV", { class: true });
    			var div13_nodes = children(div13);
    			div0 = claim_element(div13_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			h50 = claim_element(div0_nodes, "H5", { class: true, id: true });
    			var h50_nodes = children(h50);
    			t0 = claim_text(h50_nodes, "Форма обратной свзяи");
    			h50_nodes.forEach(detach_dev);
    			t1 = claim_space(div0_nodes);

    			button0 = claim_element(div0_nodes, "BUTTON", {
    				type: true,
    				class: true,
    				"data-dismiss": true,
    				"aria-label": true
    			});

    			var button0_nodes = children(button0);
    			span0 = claim_element(button0_nodes, "SPAN", { "aria-hidden": true });
    			children(span0).forEach(detach_dev);
    			button0_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			t2 = claim_space(div13_nodes);
    			form0 = claim_element(div13_nodes, "FORM", { action: true, method: true });
    			var form0_nodes = children(form0);
    			div9 = claim_element(form0_nodes, "DIV", { class: true });
    			var div9_nodes = children(div9);
    			div2 = claim_element(div9_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			div1 = claim_element(div2_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			p0 = claim_element(div1_nodes, "P", { class: true });
    			var p0_nodes = children(p0);
    			t3 = claim_text(p0_nodes, "Мы свяжемся с вами в течении 15 минут! Ждите звонка");
    			p0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			t4 = claim_space(div9_nodes);
    			div5 = claim_element(div9_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			div3 = claim_element(div5_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);

    			input0 = claim_element(div3_nodes, "INPUT", {
    				type: true,
    				name: true,
    				placeholder: true,
    				required: true,
    				class: true
    			});

    			div3_nodes.forEach(detach_dev);
    			t5 = claim_space(div5_nodes);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);

    			input1 = claim_element(div4_nodes, "INPUT", {
    				type: true,
    				name: true,
    				placeholder: true,
    				required: true,
    				class: true
    			});

    			div4_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			t6 = claim_space(div9_nodes);
    			div8 = claim_element(div9_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);
    			div6 = claim_element(div8_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);

    			input2 = claim_element(div6_nodes, "INPUT", {
    				type: true,
    				name: true,
    				id: true,
    				placeholder: true,
    				required: true,
    				class: true
    			});

    			div6_nodes.forEach(detach_dev);
    			t7 = claim_space(div8_nodes);
    			div7 = claim_element(div8_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);

    			input3 = claim_element(div7_nodes, "INPUT", {
    				type: true,
    				name: true,
    				placeholder: true,
    				required: true,
    				class: true
    			});

    			div7_nodes.forEach(detach_dev);
    			div8_nodes.forEach(detach_dev);
    			div9_nodes.forEach(detach_dev);
    			t8 = claim_space(form0_nodes);
    			div12 = claim_element(form0_nodes, "DIV", { class: true });
    			var div12_nodes = children(div12);
    			div11 = claim_element(div12_nodes, "DIV", { class: true });
    			var div11_nodes = children(div11);
    			div10 = claim_element(div11_nodes, "DIV", { class: true });
    			var div10_nodes = children(div10);
    			button1 = claim_element(div10_nodes, "BUTTON", { class: true, type: true });
    			var button1_nodes = children(button1);
    			t9 = claim_text(button1_nodes, "Отправить заявку");
    			button1_nodes.forEach(detach_dev);
    			div10_nodes.forEach(detach_dev);
    			div11_nodes.forEach(detach_dev);
    			div12_nodes.forEach(detach_dev);
    			form0_nodes.forEach(detach_dev);
    			div13_nodes.forEach(detach_dev);
    			div14_nodes.forEach(detach_dev);
    			div15_nodes.forEach(detach_dev);
    			t10 = claim_space(nodes);

    			div31 = claim_element(nodes, "DIV", {
    				class: true,
    				id: true,
    				tabindex: true,
    				"aria-labelledby": true,
    				"aria-hidden": true
    			});

    			var div31_nodes = children(div31);
    			div30 = claim_element(div31_nodes, "DIV", { class: true });
    			var div30_nodes = children(div30);
    			div29 = claim_element(div30_nodes, "DIV", { class: true });
    			var div29_nodes = children(div29);
    			div16 = claim_element(div29_nodes, "DIV", { class: true });
    			var div16_nodes = children(div16);
    			h51 = claim_element(div16_nodes, "H5", { class: true, id: true });
    			var h51_nodes = children(h51);
    			t11 = claim_text(h51_nodes, "Форма обратной свзяи");
    			h51_nodes.forEach(detach_dev);
    			t12 = claim_space(div16_nodes);

    			button2 = claim_element(div16_nodes, "BUTTON", {
    				type: true,
    				class: true,
    				"data-dismiss": true,
    				"aria-label": true
    			});

    			var button2_nodes = children(button2);
    			span1 = claim_element(button2_nodes, "SPAN", { "aria-hidden": true });
    			children(span1).forEach(detach_dev);
    			button2_nodes.forEach(detach_dev);
    			div16_nodes.forEach(detach_dev);
    			t13 = claim_space(div29_nodes);
    			form1 = claim_element(div29_nodes, "FORM", { action: true, method: true });
    			var form1_nodes = children(form1);
    			div25 = claim_element(form1_nodes, "DIV", { class: true });
    			var div25_nodes = children(div25);
    			div18 = claim_element(div25_nodes, "DIV", { class: true });
    			var div18_nodes = children(div18);
    			div17 = claim_element(div18_nodes, "DIV", { class: true });
    			var div17_nodes = children(div17);
    			p1 = claim_element(div17_nodes, "P", { class: true });
    			var p1_nodes = children(p1);
    			t14 = claim_text(p1_nodes, "Мы свяжемся с вами в течении 15 минут! Ждите звонка");
    			p1_nodes.forEach(detach_dev);
    			div17_nodes.forEach(detach_dev);
    			div18_nodes.forEach(detach_dev);
    			t15 = claim_space(div25_nodes);
    			div21 = claim_element(div25_nodes, "DIV", { class: true });
    			var div21_nodes = children(div21);
    			div19 = claim_element(div21_nodes, "DIV", { class: true });
    			var div19_nodes = children(div19);

    			input4 = claim_element(div19_nodes, "INPUT", {
    				type: true,
    				name: true,
    				placeholder: true,
    				required: true,
    				class: true
    			});

    			div19_nodes.forEach(detach_dev);
    			t16 = claim_space(div21_nodes);
    			div20 = claim_element(div21_nodes, "DIV", { class: true });
    			var div20_nodes = children(div20);

    			input5 = claim_element(div20_nodes, "INPUT", {
    				type: true,
    				name: true,
    				placeholder: true,
    				required: true,
    				class: true
    			});

    			div20_nodes.forEach(detach_dev);
    			div21_nodes.forEach(detach_dev);
    			t17 = claim_space(div25_nodes);
    			div24 = claim_element(div25_nodes, "DIV", { class: true });
    			var div24_nodes = children(div24);
    			div22 = claim_element(div24_nodes, "DIV", { class: true });
    			var div22_nodes = children(div22);

    			input6 = claim_element(div22_nodes, "INPUT", {
    				type: true,
    				name: true,
    				id: true,
    				placeholder: true,
    				required: true,
    				class: true
    			});

    			div22_nodes.forEach(detach_dev);
    			t18 = claim_space(div24_nodes);
    			div23 = claim_element(div24_nodes, "DIV", { class: true });
    			var div23_nodes = children(div23);

    			input7 = claim_element(div23_nodes, "INPUT", {
    				type: true,
    				name: true,
    				placeholder: true,
    				required: true,
    				class: true
    			});

    			div23_nodes.forEach(detach_dev);
    			div24_nodes.forEach(detach_dev);
    			div25_nodes.forEach(detach_dev);
    			t19 = claim_space(form1_nodes);
    			div28 = claim_element(form1_nodes, "DIV", { class: true });
    			var div28_nodes = children(div28);
    			div27 = claim_element(div28_nodes, "DIV", { class: true });
    			var div27_nodes = children(div27);
    			div26 = claim_element(div27_nodes, "DIV", { class: true });
    			var div26_nodes = children(div26);
    			button3 = claim_element(div26_nodes, "BUTTON", { class: true, type: true });
    			var button3_nodes = children(button3);
    			t20 = claim_text(button3_nodes, "Отправить заявку");
    			button3_nodes.forEach(detach_dev);
    			div26_nodes.forEach(detach_dev);
    			div27_nodes.forEach(detach_dev);
    			div28_nodes.forEach(detach_dev);
    			form1_nodes.forEach(detach_dev);
    			div29_nodes.forEach(detach_dev);
    			div30_nodes.forEach(detach_dev);
    			div31_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h50, "class", "modal-title svelte-l57dz5");
    			attr_dev(h50, "id", "modal__header__label");
    			add_location(h50, file$b, 6, 16, 275);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$b, 8, 20, 470);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn-close svelte-l57dz5");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$b, 7, 16, 368);
    			attr_dev(div0, "class", "modal-header svelte-l57dz5");
    			add_location(div0, file$b, 5, 12, 231);
    			attr_dev(p0, "class", "modal__text svelte-l57dz5");
    			add_location(p0, file$b, 15, 28, 761);
    			attr_dev(div1, "class", "col");
    			add_location(div1, file$b, 14, 24, 714);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$b, 13, 20, 671);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "name");
    			attr_dev(input0, "placeholder", "Ваше имя");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-l57dz5");
    			add_location(input0, file$b, 20, 28, 1043);
    			attr_dev(div3, "class", "col-xl-6 col-lg-6 col-md-6 col-sm-6");
    			add_location(div3, file$b, 19, 24, 964);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "secondName");
    			attr_dev(input1, "placeholder", "Ваша фамилия");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-l57dz5");
    			add_location(input1, file$b, 23, 28, 1243);
    			attr_dev(div4, "class", "col-xl-6 col-lg-6 col-md-6 col-sm-6");
    			add_location(div4, file$b, 22, 24, 1164);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$b, 18, 20, 921);
    			attr_dev(input2, "type", "tel");
    			attr_dev(input2, "name", "phone");
    			attr_dev(input2, "id", "tel");
    			attr_dev(input2, "placeholder", "Ваш номер телефона");
    			input2.required = true;
    			attr_dev(input2, "class", "svelte-l57dz5");
    			add_location(input2, file$b, 28, 28, 1520);
    			attr_dev(div6, "class", "col-xl-6 col-lg-6 col-md-6 col-sm-6");
    			add_location(div6, file$b, 27, 24, 1441);
    			attr_dev(input3, "type", "email");
    			attr_dev(input3, "name", "email");
    			attr_dev(input3, "placeholder", "Ваша электронная почта");
    			input3.required = true;
    			attr_dev(input3, "class", "svelte-l57dz5");
    			add_location(input3, file$b, 31, 28, 1739);
    			attr_dev(div7, "class", "col-xl-6 col-lg-6 col-md-6 col-sm-6");
    			add_location(div7, file$b, 30, 24, 1660);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$b, 26, 20, 1398);
    			attr_dev(div9, "class", "modal-body svelte-l57dz5");
    			add_location(div9, file$b, 12, 16, 625);
    			attr_dev(button1, "class", "form_btn_popup svelte-l57dz5");
    			attr_dev(button1, "type", "submit");
    			add_location(button1, file$b, 38, 28, 2064);
    			attr_dev(div10, "class", "col-xl-12");
    			add_location(div10, file$b, 37, 24, 2011);
    			attr_dev(div11, "class", "row");
    			add_location(div11, file$b, 36, 20, 1968);
    			attr_dev(div12, "class", "modal-footer svelte-l57dz5");
    			add_location(div12, file$b, 35, 16, 1920);
    			attr_dev(form0, "action", "send_popup.php");
    			attr_dev(form0, "method", "POST");
    			add_location(form0, file$b, 11, 12, 563);
    			attr_dev(div13, "class", "modal-content svelte-l57dz5");
    			add_location(div13, file$b, 4, 8, 190);
    			attr_dev(div14, "class", "modal-dialog modal-dialog-centered svelte-l57dz5");
    			add_location(div14, file$b, 3, 4, 132);
    			attr_dev(div15, "class", "modal fade svelte-l57dz5");
    			attr_dev(div15, "id", "first__modal__header");
    			attr_dev(div15, "tabindex", "-1");
    			attr_dev(div15, "aria-labelledby", "modal__header__label");
    			attr_dev(div15, "aria-hidden", "true");
    			add_location(div15, file$b, 2, 0, 4);
    			attr_dev(h51, "class", "modal-title svelte-l57dz5");
    			attr_dev(h51, "id", "modal__header__label");
    			add_location(h51, file$b, 51, 16, 2551);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file$b, 53, 20, 2746);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn-close svelte-l57dz5");
    			attr_dev(button2, "data-dismiss", "modal");
    			attr_dev(button2, "aria-label", "Close");
    			add_location(button2, file$b, 52, 16, 2644);
    			attr_dev(div16, "class", "modal-header svelte-l57dz5");
    			add_location(div16, file$b, 50, 12, 2507);
    			attr_dev(p1, "class", "modal__text svelte-l57dz5");
    			add_location(p1, file$b, 60, 28, 3037);
    			attr_dev(div17, "class", "col");
    			add_location(div17, file$b, 59, 24, 2990);
    			attr_dev(div18, "class", "row");
    			add_location(div18, file$b, 58, 20, 2947);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "name", "name");
    			attr_dev(input4, "placeholder", "Ваше имя");
    			input4.required = true;
    			attr_dev(input4, "class", "svelte-l57dz5");
    			add_location(input4, file$b, 65, 28, 3319);
    			attr_dev(div19, "class", "col-xl-6 col-lg-6 col-md-6 col-sm-6");
    			add_location(div19, file$b, 64, 24, 3240);
    			attr_dev(input5, "type", "text");
    			attr_dev(input5, "name", "secondName");
    			attr_dev(input5, "placeholder", "Ваша фамилия");
    			input5.required = true;
    			attr_dev(input5, "class", "svelte-l57dz5");
    			add_location(input5, file$b, 68, 28, 3519);
    			attr_dev(div20, "class", "col-xl-6 col-lg-6 col-md-6 col-sm-6");
    			add_location(div20, file$b, 67, 24, 3440);
    			attr_dev(div21, "class", "row");
    			add_location(div21, file$b, 63, 20, 3197);
    			attr_dev(input6, "type", "tel");
    			attr_dev(input6, "name", "phone");
    			attr_dev(input6, "id", "tel");
    			attr_dev(input6, "placeholder", "Ваш номер телефона");
    			input6.required = true;
    			attr_dev(input6, "class", "svelte-l57dz5");
    			add_location(input6, file$b, 73, 28, 3796);
    			attr_dev(div22, "class", "col-xl-6 col-lg-6 col-md-6 col-sm-6");
    			add_location(div22, file$b, 72, 24, 3717);
    			attr_dev(input7, "type", "email");
    			attr_dev(input7, "name", "email");
    			attr_dev(input7, "placeholder", "Ваша электронная почта");
    			input7.required = true;
    			attr_dev(input7, "class", "svelte-l57dz5");
    			add_location(input7, file$b, 76, 28, 4015);
    			attr_dev(div23, "class", "col-xl-6 col-lg-6 col-md-6 col-sm-6");
    			add_location(div23, file$b, 75, 24, 3936);
    			attr_dev(div24, "class", "row");
    			add_location(div24, file$b, 71, 20, 3674);
    			attr_dev(div25, "class", "modal-body svelte-l57dz5");
    			add_location(div25, file$b, 57, 16, 2901);
    			attr_dev(button3, "class", "form_btn_popup svelte-l57dz5");
    			attr_dev(button3, "type", "submit");
    			add_location(button3, file$b, 83, 28, 4340);
    			attr_dev(div26, "class", "col-xl-12");
    			add_location(div26, file$b, 82, 24, 4287);
    			attr_dev(div27, "class", "row");
    			add_location(div27, file$b, 81, 20, 4244);
    			attr_dev(div28, "class", "modal-footer svelte-l57dz5");
    			add_location(div28, file$b, 80, 16, 4196);
    			attr_dev(form1, "action", "send_popup.php");
    			attr_dev(form1, "method", "POST");
    			add_location(form1, file$b, 56, 12, 2839);
    			attr_dev(div29, "class", "modal-content svelte-l57dz5");
    			add_location(div29, file$b, 49, 8, 2466);
    			attr_dev(div30, "class", "modal-dialog modal-dialog-centered svelte-l57dz5");
    			add_location(div30, file$b, 48, 4, 2408);
    			attr_dev(div31, "class", "modal fade svelte-l57dz5");
    			attr_dev(div31, "id", "second__modal__header");
    			attr_dev(div31, "tabindex", "-1");
    			attr_dev(div31, "aria-labelledby", "modal__header__label");
    			attr_dev(div31, "aria-hidden", "true");
    			add_location(div31, file$b, 47, 0, 2279);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div0);
    			append_dev(div0, h50);
    			append_dev(h50, t0);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(button0, span0);
    			append_dev(div13, t2);
    			append_dev(div13, form0);
    			append_dev(form0, div9);
    			append_dev(div9, div2);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t3);
    			append_dev(div9, t4);
    			append_dev(div9, div5);
    			append_dev(div5, div3);
    			append_dev(div3, input0);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, input1);
    			append_dev(div9, t6);
    			append_dev(div9, div8);
    			append_dev(div8, div6);
    			append_dev(div6, input2);
    			append_dev(div8, t7);
    			append_dev(div8, div7);
    			append_dev(div7, input3);
    			append_dev(form0, t8);
    			append_dev(form0, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, button1);
    			append_dev(button1, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, div31, anchor);
    			append_dev(div31, div30);
    			append_dev(div30, div29);
    			append_dev(div29, div16);
    			append_dev(div16, h51);
    			append_dev(h51, t11);
    			append_dev(div16, t12);
    			append_dev(div16, button2);
    			append_dev(button2, span1);
    			append_dev(div29, t13);
    			append_dev(div29, form1);
    			append_dev(form1, div25);
    			append_dev(div25, div18);
    			append_dev(div18, div17);
    			append_dev(div17, p1);
    			append_dev(p1, t14);
    			append_dev(div25, t15);
    			append_dev(div25, div21);
    			append_dev(div21, div19);
    			append_dev(div19, input4);
    			append_dev(div21, t16);
    			append_dev(div21, div20);
    			append_dev(div20, input5);
    			append_dev(div25, t17);
    			append_dev(div25, div24);
    			append_dev(div24, div22);
    			append_dev(div22, input6);
    			append_dev(div24, t18);
    			append_dev(div24, div23);
    			append_dev(div23, input7);
    			append_dev(form1, t19);
    			append_dev(form1, div28);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			append_dev(div26, button3);
    			append_dev(button3, t20);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(div31);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ModalPopup", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModalPopup> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ModalPopup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalPopup",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\ModalPopupVertical.svelte generated by Svelte v3.29.7 */

    const file$c = "src\\ModalPopupVertical.svelte";

    function create_fragment$c(ctx) {
    	let div5;
    	let div4;
    	let div3;
    	let div0;
    	let h50;
    	let t0;
    	let t1;
    	let button0;
    	let span0;
    	let t2;
    	let div1;
    	let h20;
    	let t3;
    	let t4;
    	let p0;
    	let t5;
    	let t6;
    	let p1;
    	let t7;
    	let t8;
    	let p2;
    	let t9;
    	let t10;
    	let p3;
    	let t11;
    	let t12;
    	let p4;
    	let t13;
    	let t14;
    	let p5;
    	let t15;
    	let t16;
    	let div2;
    	let button1;
    	let t17;
    	let t18;
    	let div11;
    	let div10;
    	let div9;
    	let div6;
    	let h3;
    	let t19;
    	let t20;
    	let button2;
    	let span1;
    	let t21;
    	let div7;
    	let h4;
    	let t22;
    	let t23;
    	let p6;
    	let t24;
    	let t25;
    	let p7;
    	let t26;
    	let t27;
    	let p8;
    	let t28;
    	let t29;
    	let p9;
    	let t30;
    	let t31;
    	let p10;
    	let t32;
    	let t33;
    	let p11;
    	let t34;
    	let t35;
    	let div8;
    	let button3;
    	let t36;
    	let t37;
    	let div17;
    	let div16;
    	let div15;
    	let div12;
    	let h51;
    	let t38;
    	let t39;
    	let button4;
    	let span2;
    	let t40;
    	let div13;
    	let h21;
    	let t41;
    	let t42;
    	let p12;
    	let t43;
    	let t44;
    	let p13;
    	let t45;
    	let t46;
    	let p14;
    	let t47;
    	let t48;
    	let p15;
    	let t49;
    	let t50;
    	let p16;
    	let t51;
    	let t52;
    	let p17;
    	let t53;
    	let t54;
    	let div14;
    	let button5;
    	let t55;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h50 = element("h5");
    			t0 = text("Базовый тариф");
    			t1 = space();
    			button0 = element("button");
    			span0 = element("span");
    			t2 = space();
    			div1 = element("div");
    			h20 = element("h2");
    			t3 = text("Mollit cupidatat laborum sunt aute ullamco est nostrud enim duis sint excepteur reprehenderit cillum.");
    			t4 = space();
    			p0 = element("p");
    			t5 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t6 = space();
    			p1 = element("p");
    			t7 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t8 = space();
    			p2 = element("p");
    			t9 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t10 = space();
    			p3 = element("p");
    			t11 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t12 = space();
    			p4 = element("p");
    			t13 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t14 = space();
    			p5 = element("p");
    			t15 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t16 = space();
    			div2 = element("div");
    			button1 = element("button");
    			t17 = text("Понятно");
    			t18 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div6 = element("div");
    			h3 = element("h3");
    			t19 = text("Расширенный тариф");
    			t20 = space();
    			button2 = element("button");
    			span1 = element("span");
    			t21 = space();
    			div7 = element("div");
    			h4 = element("h4");
    			t22 = text("Mollit cupidatat laborum sunt aute ullamco est nostrud enim duis sint excepteur reprehenderit cillum.");
    			t23 = space();
    			p6 = element("p");
    			t24 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t25 = space();
    			p7 = element("p");
    			t26 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t27 = space();
    			p8 = element("p");
    			t28 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t29 = space();
    			p9 = element("p");
    			t30 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t31 = space();
    			p10 = element("p");
    			t32 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t33 = space();
    			p11 = element("p");
    			t34 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t35 = space();
    			div8 = element("div");
    			button3 = element("button");
    			t36 = text("Понятно");
    			t37 = space();
    			div17 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			div12 = element("div");
    			h51 = element("h5");
    			t38 = text("Безлимитный тариф");
    			t39 = space();
    			button4 = element("button");
    			span2 = element("span");
    			t40 = space();
    			div13 = element("div");
    			h21 = element("h2");
    			t41 = text("Mollit cupidatat laborum sunt aute ullamco est nostrud enim duis sint excepteur reprehenderit cillum.");
    			t42 = space();
    			p12 = element("p");
    			t43 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t44 = space();
    			p13 = element("p");
    			t45 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t46 = space();
    			p14 = element("p");
    			t47 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t48 = space();
    			p15 = element("p");
    			t49 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t50 = space();
    			p16 = element("p");
    			t51 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t52 = space();
    			p17 = element("p");
    			t53 = text("Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			t54 = space();
    			div14 = element("div");
    			button5 = element("button");
    			t55 = text("Понятно");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div5 = claim_element(nodes, "DIV", {
    				class: true,
    				id: true,
    				tabindex: true,
    				"aria-labelledby": true,
    				"aria-hidden": true
    			});

    			var div5_nodes = children(div5);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			div3 = claim_element(div4_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div0 = claim_element(div3_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			h50 = claim_element(div0_nodes, "H5", { class: true, id: true });
    			var h50_nodes = children(h50);
    			t0 = claim_text(h50_nodes, "Базовый тариф");
    			h50_nodes.forEach(detach_dev);
    			t1 = claim_space(div0_nodes);

    			button0 = claim_element(div0_nodes, "BUTTON", {
    				type: true,
    				class: true,
    				"data-dismiss": true,
    				"aria-label": true
    			});

    			var button0_nodes = children(button0);
    			span0 = claim_element(button0_nodes, "SPAN", { "aria-hidden": true });
    			children(span0).forEach(detach_dev);
    			button0_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			t2 = claim_space(div3_nodes);
    			div1 = claim_element(div3_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			h20 = claim_element(div1_nodes, "H2", {});
    			var h20_nodes = children(h20);
    			t3 = claim_text(h20_nodes, "Mollit cupidatat laborum sunt aute ullamco est nostrud enim duis sint excepteur reprehenderit cillum.");
    			h20_nodes.forEach(detach_dev);
    			t4 = claim_space(div1_nodes);
    			p0 = claim_element(div1_nodes, "P", {});
    			var p0_nodes = children(p0);
    			t5 = claim_text(p0_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p0_nodes.forEach(detach_dev);
    			t6 = claim_space(div1_nodes);
    			p1 = claim_element(div1_nodes, "P", {});
    			var p1_nodes = children(p1);
    			t7 = claim_text(p1_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p1_nodes.forEach(detach_dev);
    			t8 = claim_space(div1_nodes);
    			p2 = claim_element(div1_nodes, "P", {});
    			var p2_nodes = children(p2);
    			t9 = claim_text(p2_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p2_nodes.forEach(detach_dev);
    			t10 = claim_space(div1_nodes);
    			p3 = claim_element(div1_nodes, "P", {});
    			var p3_nodes = children(p3);
    			t11 = claim_text(p3_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p3_nodes.forEach(detach_dev);
    			t12 = claim_space(div1_nodes);
    			p4 = claim_element(div1_nodes, "P", {});
    			var p4_nodes = children(p4);
    			t13 = claim_text(p4_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p4_nodes.forEach(detach_dev);
    			t14 = claim_space(div1_nodes);
    			p5 = claim_element(div1_nodes, "P", {});
    			var p5_nodes = children(p5);
    			t15 = claim_text(p5_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p5_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			t16 = claim_space(div3_nodes);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);

    			button1 = claim_element(div2_nodes, "BUTTON", {
    				type: true,
    				class: true,
    				"data-dismiss": true
    			});

    			var button1_nodes = children(button1);
    			t17 = claim_text(button1_nodes, "Понятно");
    			button1_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			t18 = claim_space(nodes);

    			div11 = claim_element(nodes, "DIV", {
    				class: true,
    				id: true,
    				tabindex: true,
    				"aria-labelledby": true,
    				"aria-hidden": true
    			});

    			var div11_nodes = children(div11);
    			div10 = claim_element(div11_nodes, "DIV", { class: true });
    			var div10_nodes = children(div10);
    			div9 = claim_element(div10_nodes, "DIV", { class: true });
    			var div9_nodes = children(div9);
    			div6 = claim_element(div9_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			h3 = claim_element(div6_nodes, "H3", { class: true, id: true });
    			var h3_nodes = children(h3);
    			t19 = claim_text(h3_nodes, "Расширенный тариф");
    			h3_nodes.forEach(detach_dev);
    			t20 = claim_space(div6_nodes);

    			button2 = claim_element(div6_nodes, "BUTTON", {
    				type: true,
    				class: true,
    				"data-dismiss": true,
    				"aria-label": true
    			});

    			var button2_nodes = children(button2);
    			span1 = claim_element(button2_nodes, "SPAN", { "aria-hidden": true });
    			children(span1).forEach(detach_dev);
    			button2_nodes.forEach(detach_dev);
    			div6_nodes.forEach(detach_dev);
    			t21 = claim_space(div9_nodes);
    			div7 = claim_element(div9_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			h4 = claim_element(div7_nodes, "H4", {});
    			var h4_nodes = children(h4);
    			t22 = claim_text(h4_nodes, "Mollit cupidatat laborum sunt aute ullamco est nostrud enim duis sint excepteur reprehenderit cillum.");
    			h4_nodes.forEach(detach_dev);
    			t23 = claim_space(div7_nodes);
    			p6 = claim_element(div7_nodes, "P", {});
    			var p6_nodes = children(p6);
    			t24 = claim_text(p6_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p6_nodes.forEach(detach_dev);
    			t25 = claim_space(div7_nodes);
    			p7 = claim_element(div7_nodes, "P", {});
    			var p7_nodes = children(p7);
    			t26 = claim_text(p7_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p7_nodes.forEach(detach_dev);
    			t27 = claim_space(div7_nodes);
    			p8 = claim_element(div7_nodes, "P", {});
    			var p8_nodes = children(p8);
    			t28 = claim_text(p8_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p8_nodes.forEach(detach_dev);
    			t29 = claim_space(div7_nodes);
    			p9 = claim_element(div7_nodes, "P", {});
    			var p9_nodes = children(p9);
    			t30 = claim_text(p9_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p9_nodes.forEach(detach_dev);
    			t31 = claim_space(div7_nodes);
    			p10 = claim_element(div7_nodes, "P", {});
    			var p10_nodes = children(p10);
    			t32 = claim_text(p10_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p10_nodes.forEach(detach_dev);
    			t33 = claim_space(div7_nodes);
    			p11 = claim_element(div7_nodes, "P", {});
    			var p11_nodes = children(p11);
    			t34 = claim_text(p11_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p11_nodes.forEach(detach_dev);
    			div7_nodes.forEach(detach_dev);
    			t35 = claim_space(div9_nodes);
    			div8 = claim_element(div9_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);

    			button3 = claim_element(div8_nodes, "BUTTON", {
    				type: true,
    				class: true,
    				"data-dismiss": true
    			});

    			var button3_nodes = children(button3);
    			t36 = claim_text(button3_nodes, "Понятно");
    			button3_nodes.forEach(detach_dev);
    			div8_nodes.forEach(detach_dev);
    			div9_nodes.forEach(detach_dev);
    			div10_nodes.forEach(detach_dev);
    			div11_nodes.forEach(detach_dev);
    			t37 = claim_space(nodes);

    			div17 = claim_element(nodes, "DIV", {
    				class: true,
    				id: true,
    				tabindex: true,
    				"aria-labelledby": true,
    				"aria-hidden": true
    			});

    			var div17_nodes = children(div17);
    			div16 = claim_element(div17_nodes, "DIV", { class: true });
    			var div16_nodes = children(div16);
    			div15 = claim_element(div16_nodes, "DIV", { class: true });
    			var div15_nodes = children(div15);
    			div12 = claim_element(div15_nodes, "DIV", { class: true });
    			var div12_nodes = children(div12);
    			h51 = claim_element(div12_nodes, "H5", { class: true, id: true });
    			var h51_nodes = children(h51);
    			t38 = claim_text(h51_nodes, "Безлимитный тариф");
    			h51_nodes.forEach(detach_dev);
    			t39 = claim_space(div12_nodes);

    			button4 = claim_element(div12_nodes, "BUTTON", {
    				type: true,
    				class: true,
    				"data-dismiss": true,
    				"aria-label": true
    			});

    			var button4_nodes = children(button4);
    			span2 = claim_element(button4_nodes, "SPAN", { "aria-hidden": true });
    			children(span2).forEach(detach_dev);
    			button4_nodes.forEach(detach_dev);
    			div12_nodes.forEach(detach_dev);
    			t40 = claim_space(div15_nodes);
    			div13 = claim_element(div15_nodes, "DIV", { class: true });
    			var div13_nodes = children(div13);
    			h21 = claim_element(div13_nodes, "H2", {});
    			var h21_nodes = children(h21);
    			t41 = claim_text(h21_nodes, "Mollit cupidatat laborum sunt aute ullamco est nostrud enim duis sint excepteur reprehenderit cillum.");
    			h21_nodes.forEach(detach_dev);
    			t42 = claim_space(div13_nodes);
    			p12 = claim_element(div13_nodes, "P", {});
    			var p12_nodes = children(p12);
    			t43 = claim_text(p12_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p12_nodes.forEach(detach_dev);
    			t44 = claim_space(div13_nodes);
    			p13 = claim_element(div13_nodes, "P", {});
    			var p13_nodes = children(p13);
    			t45 = claim_text(p13_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p13_nodes.forEach(detach_dev);
    			t46 = claim_space(div13_nodes);
    			p14 = claim_element(div13_nodes, "P", {});
    			var p14_nodes = children(p14);
    			t47 = claim_text(p14_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p14_nodes.forEach(detach_dev);
    			t48 = claim_space(div13_nodes);
    			p15 = claim_element(div13_nodes, "P", {});
    			var p15_nodes = children(p15);
    			t49 = claim_text(p15_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p15_nodes.forEach(detach_dev);
    			t50 = claim_space(div13_nodes);
    			p16 = claim_element(div13_nodes, "P", {});
    			var p16_nodes = children(p16);
    			t51 = claim_text(p16_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p16_nodes.forEach(detach_dev);
    			t52 = claim_space(div13_nodes);
    			p17 = claim_element(div13_nodes, "P", {});
    			var p17_nodes = children(p17);
    			t53 = claim_text(p17_nodes, "Ullamco qui aliqua cupidatat commodo et veniam sunt quis qui magna. \r\n            Cillum velit dolor ipsum sit Lorem eu. \r\n            Laboris dolore do proident aute tempor tempor Lorem ullamco occaecat ipsum laborum fugiat commodo sunt. \r\n            Tempor nulla esse incididunt do. In cupidatat id eu cupidatat ea magna excepteur proident elit duis pariatur.");
    			p17_nodes.forEach(detach_dev);
    			div13_nodes.forEach(detach_dev);
    			t54 = claim_space(div15_nodes);
    			div14 = claim_element(div15_nodes, "DIV", { class: true });
    			var div14_nodes = children(div14);

    			button5 = claim_element(div14_nodes, "BUTTON", {
    				type: true,
    				class: true,
    				"data-dismiss": true
    			});

    			var button5_nodes = children(button5);
    			t55 = claim_text(button5_nodes, "Понятно");
    			button5_nodes.forEach(detach_dev);
    			div14_nodes.forEach(detach_dev);
    			div15_nodes.forEach(detach_dev);
    			div16_nodes.forEach(detach_dev);
    			div17_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h50, "class", "modal-title");
    			attr_dev(h50, "id", "first__vertical__popupLabel");
    			add_location(h50, file$c, 4, 10, 295);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$c, 6, 12, 476);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn-close svelte-1qz8ga5");
    			attr_dev(button0, "data-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$c, 5, 10, 382);
    			attr_dev(div0, "class", "modal-header svelte-1qz8ga5");
    			add_location(div0, file$c, 3, 8, 257);
    			add_location(h20, file$c, 10, 10, 591);
    			add_location(p0, file$c, 13, 10, 741);
    			add_location(p1, file$c, 19, 10, 1148);
    			add_location(p2, file$c, 25, 10, 1557);
    			add_location(p3, file$c, 31, 10, 1966);
    			add_location(p4, file$c, 37, 10, 2375);
    			add_location(p5, file$c, 43, 10, 2783);
    			attr_dev(div1, "class", "modal-body svelte-1qz8ga5");
    			add_location(div1, file$c, 9, 8, 555);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn svelte-1qz8ga5");
    			attr_dev(button1, "data-dismiss", "modal");
    			add_location(button1, file$c, 51, 10, 3244);
    			attr_dev(div2, "class", "modal-footer svelte-1qz8ga5");
    			add_location(div2, file$c, 50, 8, 3206);
    			attr_dev(div3, "class", "modal-content");
    			add_location(div3, file$c, 2, 6, 220);
    			attr_dev(div4, "class", "modal-dialog modal-dialog-scrollable modal-lg");
    			add_location(div4, file$c, 1, 4, 153);
    			attr_dev(div5, "class", "modal fade style__popup svelte-1qz8ga5");
    			attr_dev(div5, "id", "first__vertical__popup");
    			attr_dev(div5, "tabindex", "-1");
    			attr_dev(div5, "aria-labelledby", "first__vertical__popupLabel");
    			attr_dev(div5, "aria-hidden", "true");
    			add_location(div5, file$c, 0, 2, 2);
    			attr_dev(h3, "class", "modal-title");
    			attr_dev(h3, "id", "second__vertical__popupLabel");
    			add_location(h3, file$c, 61, 10, 3668);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file$c, 63, 12, 3854);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn-close svelte-1qz8ga5");
    			attr_dev(button2, "data-dismiss", "modal");
    			attr_dev(button2, "aria-label", "Close");
    			add_location(button2, file$c, 62, 10, 3760);
    			attr_dev(div6, "class", "modal-header svelte-1qz8ga5");
    			add_location(div6, file$c, 60, 8, 3630);
    			add_location(h4, file$c, 67, 10, 3969);
    			add_location(p6, file$c, 70, 10, 4119);
    			add_location(p7, file$c, 76, 10, 4526);
    			add_location(p8, file$c, 82, 10, 4935);
    			add_location(p9, file$c, 88, 10, 5344);
    			add_location(p10, file$c, 94, 10, 5753);
    			add_location(p11, file$c, 100, 10, 6161);
    			attr_dev(div7, "class", "modal-body svelte-1qz8ga5");
    			add_location(div7, file$c, 66, 8, 3933);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "btn svelte-1qz8ga5");
    			attr_dev(button3, "data-dismiss", "modal");
    			add_location(button3, file$c, 108, 10, 6622);
    			attr_dev(div8, "class", "modal-footer svelte-1qz8ga5");
    			add_location(div8, file$c, 107, 8, 6584);
    			attr_dev(div9, "class", "modal-content");
    			add_location(div9, file$c, 59, 6, 3593);
    			attr_dev(div10, "class", "modal-dialog modal-dialog-scrollable modal-lg");
    			add_location(div10, file$c, 58, 4, 3526);
    			attr_dev(div11, "class", "modal fade style__popup svelte-1qz8ga5");
    			attr_dev(div11, "id", "second__vertical__popup");
    			attr_dev(div11, "tabindex", "-1");
    			attr_dev(div11, "aria-labelledby", "second__vertical__popupLabel");
    			attr_dev(div11, "aria-hidden", "true");
    			add_location(div11, file$c, 57, 2, 3373);
    			attr_dev(h51, "class", "modal-title");
    			attr_dev(h51, "id", "third__vertical__popupLabel");
    			add_location(h51, file$c, 118, 10, 7044);
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$c, 120, 12, 7229);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "btn-close svelte-1qz8ga5");
    			attr_dev(button4, "data-dismiss", "modal");
    			attr_dev(button4, "aria-label", "Close");
    			add_location(button4, file$c, 119, 10, 7135);
    			attr_dev(div12, "class", "modal-header svelte-1qz8ga5");
    			add_location(div12, file$c, 117, 8, 7006);
    			add_location(h21, file$c, 124, 10, 7344);
    			add_location(p12, file$c, 127, 10, 7494);
    			add_location(p13, file$c, 133, 10, 7901);
    			add_location(p14, file$c, 139, 10, 8310);
    			add_location(p15, file$c, 145, 10, 8719);
    			add_location(p16, file$c, 151, 10, 9128);
    			add_location(p17, file$c, 157, 10, 9536);
    			attr_dev(div13, "class", "modal-body svelte-1qz8ga5");
    			add_location(div13, file$c, 123, 8, 7308);
    			attr_dev(button5, "type", "button");
    			attr_dev(button5, "class", "button__good svelte-1qz8ga5");
    			attr_dev(button5, "data-dismiss", "modal");
    			add_location(button5, file$c, 165, 10, 9997);
    			attr_dev(div14, "class", "modal-footer svelte-1qz8ga5");
    			add_location(div14, file$c, 164, 8, 9959);
    			attr_dev(div15, "class", "modal-content");
    			add_location(div15, file$c, 116, 6, 6969);
    			attr_dev(div16, "class", "modal-dialog modal-dialog-scrollable modal-lg");
    			add_location(div16, file$c, 115, 4, 6902);
    			attr_dev(div17, "class", "modal fade style__popup svelte-1qz8ga5");
    			attr_dev(div17, "id", "third__vertical__popup");
    			attr_dev(div17, "tabindex", "-1");
    			attr_dev(div17, "aria-labelledby", "third__vertical__popupLabel");
    			attr_dev(div17, "aria-hidden", "true");
    			add_location(div17, file$c, 114, 2, 6751);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h50);
    			append_dev(h50, t0);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(button0, span0);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, h20);
    			append_dev(h20, t3);
    			append_dev(div1, t4);
    			append_dev(div1, p0);
    			append_dev(p0, t5);
    			append_dev(div1, t6);
    			append_dev(div1, p1);
    			append_dev(p1, t7);
    			append_dev(div1, t8);
    			append_dev(div1, p2);
    			append_dev(p2, t9);
    			append_dev(div1, t10);
    			append_dev(div1, p3);
    			append_dev(p3, t11);
    			append_dev(div1, t12);
    			append_dev(div1, p4);
    			append_dev(p4, t13);
    			append_dev(div1, t14);
    			append_dev(div1, p5);
    			append_dev(p5, t15);
    			append_dev(div3, t16);
    			append_dev(div3, div2);
    			append_dev(div2, button1);
    			append_dev(button1, t17);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div6);
    			append_dev(div6, h3);
    			append_dev(h3, t19);
    			append_dev(div6, t20);
    			append_dev(div6, button2);
    			append_dev(button2, span1);
    			append_dev(div9, t21);
    			append_dev(div9, div7);
    			append_dev(div7, h4);
    			append_dev(h4, t22);
    			append_dev(div7, t23);
    			append_dev(div7, p6);
    			append_dev(p6, t24);
    			append_dev(div7, t25);
    			append_dev(div7, p7);
    			append_dev(p7, t26);
    			append_dev(div7, t27);
    			append_dev(div7, p8);
    			append_dev(p8, t28);
    			append_dev(div7, t29);
    			append_dev(div7, p9);
    			append_dev(p9, t30);
    			append_dev(div7, t31);
    			append_dev(div7, p10);
    			append_dev(p10, t32);
    			append_dev(div7, t33);
    			append_dev(div7, p11);
    			append_dev(p11, t34);
    			append_dev(div9, t35);
    			append_dev(div9, div8);
    			append_dev(div8, button3);
    			append_dev(button3, t36);
    			insert_dev(target, t37, anchor);
    			insert_dev(target, div17, anchor);
    			append_dev(div17, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div12);
    			append_dev(div12, h51);
    			append_dev(h51, t38);
    			append_dev(div12, t39);
    			append_dev(div12, button4);
    			append_dev(button4, span2);
    			append_dev(div15, t40);
    			append_dev(div15, div13);
    			append_dev(div13, h21);
    			append_dev(h21, t41);
    			append_dev(div13, t42);
    			append_dev(div13, p12);
    			append_dev(p12, t43);
    			append_dev(div13, t44);
    			append_dev(div13, p13);
    			append_dev(p13, t45);
    			append_dev(div13, t46);
    			append_dev(div13, p14);
    			append_dev(p14, t47);
    			append_dev(div13, t48);
    			append_dev(div13, p15);
    			append_dev(p15, t49);
    			append_dev(div13, t50);
    			append_dev(div13, p16);
    			append_dev(p16, t51);
    			append_dev(div13, t52);
    			append_dev(div13, p17);
    			append_dev(p17, t53);
    			append_dev(div15, t54);
    			append_dev(div15, div14);
    			append_dev(div14, button5);
    			append_dev(button5, t55);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(div11);
    			if (detaching) detach_dev(t37);
    			if (detaching) detach_dev(div17);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ModalPopupVertical", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModalPopupVertical> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ModalPopupVertical extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalPopupVertical",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }

    function draw(node, { delay = 0, speed, duration, easing = cubicInOut }) {
        const len = node.getTotalLength();
        if (duration === undefined) {
            if (speed === undefined) {
                duration = 800;
            }
            else {
                duration = len / speed;
            }
        }
        else if (typeof duration === 'function') {
            duration = duration(len);
        }
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `stroke-dasharray: ${t * len} ${u * len}`
        };
    }

    /* src\YouGet_test.svelte generated by Svelte v3.29.7 */
    const file$d = "src\\YouGet_test.svelte";

    function create_fragment$d(ctx) {
    	let div50;
    	let h2;
    	let t0;
    	let t1;
    	let div49;
    	let div6;
    	let div2;
    	let article0;
    	let div1;
    	let div0;
    	let h30;
    	let t2;
    	let t3;
    	let p0;
    	let t4;
    	let t5;
    	let div4;
    	let div3;
    	let svg0;
    	let circle0;
    	let t6;
    	let div5;
    	let svg1;
    	let path0;
    	let t7;
    	let div13;
    	let div9;
    	let article1;
    	let div8;
    	let div7;
    	let h31;
    	let t8;
    	let t9;
    	let p1;
    	let t10;
    	let t11;
    	let div11;
    	let div10;
    	let svg2;
    	let circle1;
    	let t12;
    	let div12;
    	let svg3;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let t13;
    	let div20;
    	let div16;
    	let article2;
    	let div15;
    	let div14;
    	let h32;
    	let t14;
    	let t15;
    	let p2;
    	let t16;
    	let t17;
    	let div18;
    	let div17;
    	let svg4;
    	let circle2;
    	let t18;
    	let div19;
    	let svg5;
    	let g0;
    	let path12;
    	let path13;
    	let defs0;
    	let clipPath0;
    	let rect0;
    	let t19;
    	let div27;
    	let div23;
    	let article3;
    	let div22;
    	let div21;
    	let h33;
    	let t20;
    	let t21;
    	let p3;
    	let t22;
    	let t23;
    	let div25;
    	let div24;
    	let svg6;
    	let circle3;
    	let t24;
    	let div26;
    	let svg7;
    	let path14;
    	let path15;
    	let path16;
    	let path17;
    	let path18;
    	let path19;
    	let path20;
    	let path21;
    	let t25;
    	let div34;
    	let div30;
    	let article4;
    	let div29;
    	let div28;
    	let h34;
    	let t26;
    	let t27;
    	let p4;
    	let t28;
    	let t29;
    	let div32;
    	let div31;
    	let svg8;
    	let circle4;
    	let t30;
    	let div33;
    	let svg9;
    	let g1;
    	let path22;
    	let path23;
    	let defs1;
    	let clipPath1;
    	let rect1;
    	let t31;
    	let div41;
    	let div37;
    	let article5;
    	let div36;
    	let div35;
    	let h35;
    	let t32;
    	let t33;
    	let p5;
    	let t34;
    	let t35;
    	let div39;
    	let div38;
    	let svg10;
    	let circle5;
    	let t36;
    	let div40;
    	let svg11;
    	let path24;
    	let t37;
    	let div48;
    	let div44;
    	let article6;
    	let div43;
    	let div42;
    	let h36;
    	let t38;
    	let t39;
    	let p6;
    	let t40;
    	let t41;
    	let div46;
    	let div45;
    	let svg12;
    	let circle6;
    	let t42;
    	let div47;
    	let svg13;
    	let path25;
    	let path26;
    	let path27;
    	let path28;
    	let path29;
    	let path30;

    	const block = {
    		c: function create() {
    			div50 = element("div");
    			h2 = element("h2");
    			t0 = text("Что вы получаете");
    			t1 = space();
    			div49 = element("div");
    			div6 = element("div");
    			div2 = element("div");
    			article0 = element("article");
    			div1 = element("div");
    			div0 = element("div");
    			h30 = element("h3");
    			t2 = text("Единый стандарт обучения");
    			t3 = space();
    			p0 = element("p");
    			t4 = text("Ваши сотрудники формируют единый понятийный аппарат, который позволяет экономить время на неэффективных коммуникациях. \r\n                                Сотрудники, растущие в одной корпоративной среде, лучше понимают и принимают поставленные задачи. \r\n                                Это один из немногих простых методов повышения управляемости вашей команды");
    			t5 = space();
    			div4 = element("div");
    			div3 = element("div");
    			svg0 = svg_element("svg");
    			circle0 = svg_element("circle");
    			t6 = space();
    			div5 = element("div");
    			svg1 = svg_element("svg");
    			path0 = svg_element("path");
    			t7 = space();
    			div13 = element("div");
    			div9 = element("div");
    			article1 = element("article");
    			div8 = element("div");
    			div7 = element("div");
    			h31 = element("h3");
    			t8 = text("Широкая линейка программ");
    			t9 = space();
    			p1 = element("p");
    			t10 = text("Благодаря широкому выбору модулей вы можете «закрыть» потребности обучения на любом бизнес-направлении. \r\n                                Профессиональные и личные компетенции, «узкие» и нишевые специализации. \r\n                                Все эти возможности создают комплексный подход для любого уровня исполнения и управления");
    			t11 = space();
    			div11 = element("div");
    			div10 = element("div");
    			svg2 = svg_element("svg");
    			circle1 = svg_element("circle");
    			t12 = space();
    			div12 = element("div");
    			svg3 = svg_element("svg");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			t13 = space();
    			div20 = element("div");
    			div16 = element("div");
    			article2 = element("article");
    			div15 = element("div");
    			div14 = element("div");
    			h32 = element("h3");
    			t14 = text("Эксперты-практики");
    			t15 = space();
    			p2 = element("p");
    			t16 = text("Более 300 опытных преподавателей, прошедших внутреннюю сертификацию. \r\n                                Только практикующие специалисты: топ-менеджеры, управляющие проектами, специалисты узкого профиля, бизнес-консультанты и коучи делятся накопленными знаниями");
    			t17 = space();
    			div18 = element("div");
    			div17 = element("div");
    			svg4 = svg_element("svg");
    			circle2 = svg_element("circle");
    			t18 = space();
    			div19 = element("div");
    			svg5 = svg_element("svg");
    			g0 = svg_element("g");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			defs0 = svg_element("defs");
    			clipPath0 = svg_element("clipPath");
    			rect0 = svg_element("rect");
    			t19 = space();
    			div27 = element("div");
    			div23 = element("div");
    			article3 = element("article");
    			div22 = element("div");
    			div21 = element("div");
    			h33 = element("h3");
    			t20 = text("Гибкое расписание");
    			t21 = space();
    			p3 = element("p");
    			t22 = text("Частота программ позволяет обучать персонал компании по одной и той же тематике с регулярностью один раз в два месяца. \r\n                                Вы можете не только повышать уровень компетенций основного персонала, но и формировать кадровый резерв компании");
    			t23 = space();
    			div25 = element("div");
    			div24 = element("div");
    			svg6 = svg_element("svg");
    			circle3 = svg_element("circle");
    			t24 = space();
    			div26 = element("div");
    			svg7 = svg_element("svg");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			path19 = svg_element("path");
    			path20 = svg_element("path");
    			path21 = svg_element("path");
    			t25 = space();
    			div34 = element("div");
    			div30 = element("div");
    			article4 = element("article");
    			div29 = element("div");
    			div28 = element("div");
    			h34 = element("h3");
    			t26 = text("Экономия бюджета");
    			t27 = space();
    			p4 = element("p");
    			t28 = text("Экономя на выездном обучении и корпоративном формате, вы можете направить до 50% бюджета - на другие бизнес-цели");
    			t29 = space();
    			div32 = element("div");
    			div31 = element("div");
    			svg8 = svg_element("svg");
    			circle4 = svg_element("circle");
    			t30 = space();
    			div33 = element("div");
    			svg9 = svg_element("svg");
    			g1 = svg_element("g");
    			path22 = svg_element("path");
    			path23 = svg_element("path");
    			defs1 = svg_element("defs");
    			clipPath1 = svg_element("clipPath");
    			rect1 = svg_element("rect");
    			t31 = space();
    			div41 = element("div");
    			div37 = element("div");
    			article5 = element("article");
    			div36 = element("div");
    			div35 = element("div");
    			h35 = element("h3");
    			t32 = text("Среда обучения");
    			t33 = space();
    			p5 = element("p");
    			t34 = text("Электронная версия презентаций и дополнительных материалов отличный инструмент для использования в работе. \r\n                                Дополнительные материалы, видео и презентации повышают продуктивность и скорость передачи информации коллегам");
    			t35 = space();
    			div39 = element("div");
    			div38 = element("div");
    			svg10 = svg_element("svg");
    			circle5 = svg_element("circle");
    			t36 = space();
    			div40 = element("div");
    			svg11 = svg_element("svg");
    			path24 = svg_element("path");
    			t37 = space();
    			div48 = element("div");
    			div44 = element("div");
    			article6 = element("article");
    			div43 = element("div");
    			div42 = element("div");
    			h36 = element("h3");
    			t38 = text("Система обучения персонала");
    			t39 = space();
    			p6 = element("p");
    			t40 = text("Планирование, обучение, контроль – настроенный бизнес-процесс компании, \r\n                                с помощью которого можно проводить аттестацию, формировать кадровый резерв и строить карьерную лестницу для персонала");
    			t41 = space();
    			div46 = element("div");
    			div45 = element("div");
    			svg12 = svg_element("svg");
    			circle6 = svg_element("circle");
    			t42 = space();
    			div47 = element("div");
    			svg13 = svg_element("svg");
    			path25 = svg_element("path");
    			path26 = svg_element("path");
    			path27 = svg_element("path");
    			path28 = svg_element("path");
    			path29 = svg_element("path");
    			path30 = svg_element("path");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div50 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div50_nodes = children(div50);
    			h2 = claim_element(div50_nodes, "H2", { class: true });
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, "Что вы получаете");
    			h2_nodes.forEach(detach_dev);
    			t1 = claim_space(div50_nodes);
    			div49 = claim_element(div50_nodes, "DIV", { class: true });
    			var div49_nodes = children(div49);
    			div6 = claim_element(div49_nodes, "DIV", { class: true });
    			var div6_nodes = children(div6);
    			div2 = claim_element(div6_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			article0 = claim_element(div2_nodes, "ARTICLE", { class: true });
    			var article0_nodes = children(article0);
    			div1 = claim_element(article0_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			h30 = claim_element(div0_nodes, "H3", { class: true });
    			var h30_nodes = children(h30);
    			t2 = claim_text(h30_nodes, "Единый стандарт обучения");
    			h30_nodes.forEach(detach_dev);
    			t3 = claim_space(div0_nodes);
    			p0 = claim_element(div0_nodes, "P", { class: true });
    			var p0_nodes = children(p0);
    			t4 = claim_text(p0_nodes, "Ваши сотрудники формируют единый понятийный аппарат, который позволяет экономить время на неэффективных коммуникациях. \r\n                                Сотрудники, растущие в одной корпоративной среде, лучше понимают и принимают поставленные задачи. \r\n                                Это один из немногих простых методов повышения управляемости вашей команды");
    			p0_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			article0_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			t5 = claim_space(div6_nodes);
    			div4 = claim_element(div6_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			div3 = claim_element(div4_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);

    			svg0 = claim_element(
    				div3_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg0_nodes = children(svg0);

    			circle0 = claim_element(
    				svg0_nodes,
    				"circle",
    				{
    					cx: true,
    					cy: true,
    					r: true,
    					stroke: true,
    					"stroke-width": true
    				},
    				1
    			);

    			children(circle0).forEach(detach_dev);
    			svg0_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			div4_nodes.forEach(detach_dev);
    			t6 = claim_space(div6_nodes);
    			div5 = claim_element(div6_nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);

    			svg1 = claim_element(
    				div5_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg1_nodes = children(svg1);
    			path0 = claim_element(svg1_nodes, "path", { d: true, fill: true }, 1);
    			children(path0).forEach(detach_dev);
    			svg1_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			div6_nodes.forEach(detach_dev);
    			t7 = claim_space(div49_nodes);
    			div13 = claim_element(div49_nodes, "DIV", { class: true });
    			var div13_nodes = children(div13);
    			div9 = claim_element(div13_nodes, "DIV", { class: true });
    			var div9_nodes = children(div9);
    			article1 = claim_element(div9_nodes, "ARTICLE", { class: true });
    			var article1_nodes = children(article1);
    			div8 = claim_element(article1_nodes, "DIV", { class: true });
    			var div8_nodes = children(div8);
    			div7 = claim_element(div8_nodes, "DIV", { class: true });
    			var div7_nodes = children(div7);
    			h31 = claim_element(div7_nodes, "H3", { class: true });
    			var h31_nodes = children(h31);
    			t8 = claim_text(h31_nodes, "Широкая линейка программ");
    			h31_nodes.forEach(detach_dev);
    			t9 = claim_space(div7_nodes);
    			p1 = claim_element(div7_nodes, "P", { class: true });
    			var p1_nodes = children(p1);
    			t10 = claim_text(p1_nodes, "Благодаря широкому выбору модулей вы можете «закрыть» потребности обучения на любом бизнес-направлении. \r\n                                Профессиональные и личные компетенции, «узкие» и нишевые специализации. \r\n                                Все эти возможности создают комплексный подход для любого уровня исполнения и управления");
    			p1_nodes.forEach(detach_dev);
    			div7_nodes.forEach(detach_dev);
    			div8_nodes.forEach(detach_dev);
    			article1_nodes.forEach(detach_dev);
    			div9_nodes.forEach(detach_dev);
    			t11 = claim_space(div13_nodes);
    			div11 = claim_element(div13_nodes, "DIV", { class: true });
    			var div11_nodes = children(div11);
    			div10 = claim_element(div11_nodes, "DIV", { class: true });
    			var div10_nodes = children(div10);

    			svg2 = claim_element(
    				div10_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg2_nodes = children(svg2);

    			circle1 = claim_element(
    				svg2_nodes,
    				"circle",
    				{
    					cx: true,
    					cy: true,
    					r: true,
    					stroke: true,
    					"stroke-width": true
    				},
    				1
    			);

    			children(circle1).forEach(detach_dev);
    			svg2_nodes.forEach(detach_dev);
    			div10_nodes.forEach(detach_dev);
    			div11_nodes.forEach(detach_dev);
    			t12 = claim_space(div13_nodes);
    			div12 = claim_element(div13_nodes, "DIV", { class: true });
    			var div12_nodes = children(div12);

    			svg3 = claim_element(
    				div12_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg3_nodes = children(svg3);
    			path1 = claim_element(svg3_nodes, "path", { d: true, fill: true }, 1);
    			children(path1).forEach(detach_dev);
    			path2 = claim_element(svg3_nodes, "path", { d: true, fill: true }, 1);
    			children(path2).forEach(detach_dev);
    			path3 = claim_element(svg3_nodes, "path", { d: true, fill: true }, 1);
    			children(path3).forEach(detach_dev);
    			path4 = claim_element(svg3_nodes, "path", { d: true, fill: true }, 1);
    			children(path4).forEach(detach_dev);
    			path5 = claim_element(svg3_nodes, "path", { d: true, fill: true }, 1);
    			children(path5).forEach(detach_dev);
    			path6 = claim_element(svg3_nodes, "path", { d: true, fill: true }, 1);
    			children(path6).forEach(detach_dev);
    			path7 = claim_element(svg3_nodes, "path", { d: true, fill: true }, 1);
    			children(path7).forEach(detach_dev);
    			path8 = claim_element(svg3_nodes, "path", { d: true, fill: true }, 1);
    			children(path8).forEach(detach_dev);
    			path9 = claim_element(svg3_nodes, "path", { d: true, fill: true }, 1);
    			children(path9).forEach(detach_dev);
    			path10 = claim_element(svg3_nodes, "path", { d: true, fill: true }, 1);
    			children(path10).forEach(detach_dev);
    			path11 = claim_element(svg3_nodes, "path", { d: true, fill: true }, 1);
    			children(path11).forEach(detach_dev);
    			svg3_nodes.forEach(detach_dev);
    			div12_nodes.forEach(detach_dev);
    			div13_nodes.forEach(detach_dev);
    			t13 = claim_space(div49_nodes);
    			div20 = claim_element(div49_nodes, "DIV", { class: true });
    			var div20_nodes = children(div20);
    			div16 = claim_element(div20_nodes, "DIV", { class: true });
    			var div16_nodes = children(div16);
    			article2 = claim_element(div16_nodes, "ARTICLE", { class: true });
    			var article2_nodes = children(article2);
    			div15 = claim_element(article2_nodes, "DIV", { class: true });
    			var div15_nodes = children(div15);
    			div14 = claim_element(div15_nodes, "DIV", { class: true });
    			var div14_nodes = children(div14);
    			h32 = claim_element(div14_nodes, "H3", { class: true });
    			var h32_nodes = children(h32);
    			t14 = claim_text(h32_nodes, "Эксперты-практики");
    			h32_nodes.forEach(detach_dev);
    			t15 = claim_space(div14_nodes);
    			p2 = claim_element(div14_nodes, "P", { class: true });
    			var p2_nodes = children(p2);
    			t16 = claim_text(p2_nodes, "Более 300 опытных преподавателей, прошедших внутреннюю сертификацию. \r\n                                Только практикующие специалисты: топ-менеджеры, управляющие проектами, специалисты узкого профиля, бизнес-консультанты и коучи делятся накопленными знаниями");
    			p2_nodes.forEach(detach_dev);
    			div14_nodes.forEach(detach_dev);
    			div15_nodes.forEach(detach_dev);
    			article2_nodes.forEach(detach_dev);
    			div16_nodes.forEach(detach_dev);
    			t17 = claim_space(div20_nodes);
    			div18 = claim_element(div20_nodes, "DIV", { class: true });
    			var div18_nodes = children(div18);
    			div17 = claim_element(div18_nodes, "DIV", { class: true });
    			var div17_nodes = children(div17);

    			svg4 = claim_element(
    				div17_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg4_nodes = children(svg4);

    			circle2 = claim_element(
    				svg4_nodes,
    				"circle",
    				{
    					cx: true,
    					cy: true,
    					r: true,
    					stroke: true,
    					"stroke-width": true
    				},
    				1
    			);

    			children(circle2).forEach(detach_dev);
    			svg4_nodes.forEach(detach_dev);
    			div17_nodes.forEach(detach_dev);
    			div18_nodes.forEach(detach_dev);
    			t18 = claim_space(div20_nodes);
    			div19 = claim_element(div20_nodes, "DIV", { class: true });
    			var div19_nodes = children(div19);

    			svg5 = claim_element(
    				div19_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg5_nodes = children(svg5);
    			g0 = claim_element(svg5_nodes, "g", { "clip-path": true }, 1);
    			var g0_nodes = children(g0);
    			path12 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
    			children(path12).forEach(detach_dev);
    			path13 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
    			children(path13).forEach(detach_dev);
    			g0_nodes.forEach(detach_dev);
    			defs0 = claim_element(svg5_nodes, "defs", {}, 1);
    			var defs0_nodes = children(defs0);
    			clipPath0 = claim_element(defs0_nodes, "clipPath", { id: true }, 1);
    			var clipPath0_nodes = children(clipPath0);
    			rect0 = claim_element(clipPath0_nodes, "rect", { width: true, height: true, fill: true }, 1);
    			children(rect0).forEach(detach_dev);
    			clipPath0_nodes.forEach(detach_dev);
    			defs0_nodes.forEach(detach_dev);
    			svg5_nodes.forEach(detach_dev);
    			div19_nodes.forEach(detach_dev);
    			div20_nodes.forEach(detach_dev);
    			t19 = claim_space(div49_nodes);
    			div27 = claim_element(div49_nodes, "DIV", { class: true });
    			var div27_nodes = children(div27);
    			div23 = claim_element(div27_nodes, "DIV", { class: true });
    			var div23_nodes = children(div23);
    			article3 = claim_element(div23_nodes, "ARTICLE", { class: true });
    			var article3_nodes = children(article3);
    			div22 = claim_element(article3_nodes, "DIV", { class: true });
    			var div22_nodes = children(div22);
    			div21 = claim_element(div22_nodes, "DIV", { class: true });
    			var div21_nodes = children(div21);
    			h33 = claim_element(div21_nodes, "H3", { class: true });
    			var h33_nodes = children(h33);
    			t20 = claim_text(h33_nodes, "Гибкое расписание");
    			h33_nodes.forEach(detach_dev);
    			t21 = claim_space(div21_nodes);
    			p3 = claim_element(div21_nodes, "P", { class: true });
    			var p3_nodes = children(p3);
    			t22 = claim_text(p3_nodes, "Частота программ позволяет обучать персонал компании по одной и той же тематике с регулярностью один раз в два месяца. \r\n                                Вы можете не только повышать уровень компетенций основного персонала, но и формировать кадровый резерв компании");
    			p3_nodes.forEach(detach_dev);
    			div21_nodes.forEach(detach_dev);
    			div22_nodes.forEach(detach_dev);
    			article3_nodes.forEach(detach_dev);
    			div23_nodes.forEach(detach_dev);
    			t23 = claim_space(div27_nodes);
    			div25 = claim_element(div27_nodes, "DIV", { class: true });
    			var div25_nodes = children(div25);
    			div24 = claim_element(div25_nodes, "DIV", { class: true });
    			var div24_nodes = children(div24);

    			svg6 = claim_element(
    				div24_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg6_nodes = children(svg6);

    			circle3 = claim_element(
    				svg6_nodes,
    				"circle",
    				{
    					cx: true,
    					cy: true,
    					r: true,
    					stroke: true,
    					"stroke-width": true
    				},
    				1
    			);

    			children(circle3).forEach(detach_dev);
    			svg6_nodes.forEach(detach_dev);
    			div24_nodes.forEach(detach_dev);
    			div25_nodes.forEach(detach_dev);
    			t24 = claim_space(div27_nodes);
    			div26 = claim_element(div27_nodes, "DIV", { class: true });
    			var div26_nodes = children(div26);

    			svg7 = claim_element(
    				div26_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg7_nodes = children(svg7);
    			path14 = claim_element(svg7_nodes, "path", { d: true, fill: true }, 1);
    			children(path14).forEach(detach_dev);
    			path15 = claim_element(svg7_nodes, "path", { d: true, fill: true }, 1);
    			children(path15).forEach(detach_dev);
    			path16 = claim_element(svg7_nodes, "path", { d: true, fill: true }, 1);
    			children(path16).forEach(detach_dev);
    			path17 = claim_element(svg7_nodes, "path", { d: true, fill: true }, 1);
    			children(path17).forEach(detach_dev);
    			path18 = claim_element(svg7_nodes, "path", { d: true, fill: true }, 1);
    			children(path18).forEach(detach_dev);
    			path19 = claim_element(svg7_nodes, "path", { d: true, fill: true }, 1);
    			children(path19).forEach(detach_dev);
    			path20 = claim_element(svg7_nodes, "path", { d: true, fill: true }, 1);
    			children(path20).forEach(detach_dev);
    			path21 = claim_element(svg7_nodes, "path", { d: true, fill: true }, 1);
    			children(path21).forEach(detach_dev);
    			svg7_nodes.forEach(detach_dev);
    			div26_nodes.forEach(detach_dev);
    			div27_nodes.forEach(detach_dev);
    			t25 = claim_space(div49_nodes);
    			div34 = claim_element(div49_nodes, "DIV", { class: true });
    			var div34_nodes = children(div34);
    			div30 = claim_element(div34_nodes, "DIV", { class: true });
    			var div30_nodes = children(div30);
    			article4 = claim_element(div30_nodes, "ARTICLE", { class: true });
    			var article4_nodes = children(article4);
    			div29 = claim_element(article4_nodes, "DIV", { class: true });
    			var div29_nodes = children(div29);
    			div28 = claim_element(div29_nodes, "DIV", { class: true });
    			var div28_nodes = children(div28);
    			h34 = claim_element(div28_nodes, "H3", { class: true });
    			var h34_nodes = children(h34);
    			t26 = claim_text(h34_nodes, "Экономия бюджета");
    			h34_nodes.forEach(detach_dev);
    			t27 = claim_space(div28_nodes);
    			p4 = claim_element(div28_nodes, "P", { class: true });
    			var p4_nodes = children(p4);
    			t28 = claim_text(p4_nodes, "Экономя на выездном обучении и корпоративном формате, вы можете направить до 50% бюджета - на другие бизнес-цели");
    			p4_nodes.forEach(detach_dev);
    			div28_nodes.forEach(detach_dev);
    			div29_nodes.forEach(detach_dev);
    			article4_nodes.forEach(detach_dev);
    			div30_nodes.forEach(detach_dev);
    			t29 = claim_space(div34_nodes);
    			div32 = claim_element(div34_nodes, "DIV", { class: true });
    			var div32_nodes = children(div32);
    			div31 = claim_element(div32_nodes, "DIV", { class: true });
    			var div31_nodes = children(div31);

    			svg8 = claim_element(
    				div31_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg8_nodes = children(svg8);

    			circle4 = claim_element(
    				svg8_nodes,
    				"circle",
    				{
    					cx: true,
    					cy: true,
    					r: true,
    					stroke: true,
    					"stroke-width": true
    				},
    				1
    			);

    			children(circle4).forEach(detach_dev);
    			svg8_nodes.forEach(detach_dev);
    			div31_nodes.forEach(detach_dev);
    			div32_nodes.forEach(detach_dev);
    			t30 = claim_space(div34_nodes);
    			div33 = claim_element(div34_nodes, "DIV", { class: true });
    			var div33_nodes = children(div33);

    			svg9 = claim_element(
    				div33_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg9_nodes = children(svg9);
    			g1 = claim_element(svg9_nodes, "g", { "clip-path": true }, 1);
    			var g1_nodes = children(g1);
    			path22 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
    			children(path22).forEach(detach_dev);
    			path23 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
    			children(path23).forEach(detach_dev);
    			g1_nodes.forEach(detach_dev);
    			defs1 = claim_element(svg9_nodes, "defs", {}, 1);
    			var defs1_nodes = children(defs1);
    			clipPath1 = claim_element(defs1_nodes, "clipPath", { id: true }, 1);
    			var clipPath1_nodes = children(clipPath1);
    			rect1 = claim_element(clipPath1_nodes, "rect", { width: true, height: true, fill: true }, 1);
    			children(rect1).forEach(detach_dev);
    			clipPath1_nodes.forEach(detach_dev);
    			defs1_nodes.forEach(detach_dev);
    			svg9_nodes.forEach(detach_dev);
    			div33_nodes.forEach(detach_dev);
    			div34_nodes.forEach(detach_dev);
    			t31 = claim_space(div49_nodes);
    			div41 = claim_element(div49_nodes, "DIV", { class: true });
    			var div41_nodes = children(div41);
    			div37 = claim_element(div41_nodes, "DIV", { class: true });
    			var div37_nodes = children(div37);
    			article5 = claim_element(div37_nodes, "ARTICLE", { class: true });
    			var article5_nodes = children(article5);
    			div36 = claim_element(article5_nodes, "DIV", { class: true });
    			var div36_nodes = children(div36);
    			div35 = claim_element(div36_nodes, "DIV", { class: true });
    			var div35_nodes = children(div35);
    			h35 = claim_element(div35_nodes, "H3", { class: true });
    			var h35_nodes = children(h35);
    			t32 = claim_text(h35_nodes, "Среда обучения");
    			h35_nodes.forEach(detach_dev);
    			t33 = claim_space(div35_nodes);
    			p5 = claim_element(div35_nodes, "P", { class: true });
    			var p5_nodes = children(p5);
    			t34 = claim_text(p5_nodes, "Электронная версия презентаций и дополнительных материалов отличный инструмент для использования в работе. \r\n                                Дополнительные материалы, видео и презентации повышают продуктивность и скорость передачи информации коллегам");
    			p5_nodes.forEach(detach_dev);
    			div35_nodes.forEach(detach_dev);
    			div36_nodes.forEach(detach_dev);
    			article5_nodes.forEach(detach_dev);
    			div37_nodes.forEach(detach_dev);
    			t35 = claim_space(div41_nodes);
    			div39 = claim_element(div41_nodes, "DIV", { class: true });
    			var div39_nodes = children(div39);
    			div38 = claim_element(div39_nodes, "DIV", { class: true });
    			var div38_nodes = children(div38);

    			svg10 = claim_element(
    				div38_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg10_nodes = children(svg10);

    			circle5 = claim_element(
    				svg10_nodes,
    				"circle",
    				{
    					cx: true,
    					cy: true,
    					r: true,
    					stroke: true,
    					"stroke-width": true
    				},
    				1
    			);

    			children(circle5).forEach(detach_dev);
    			svg10_nodes.forEach(detach_dev);
    			div38_nodes.forEach(detach_dev);
    			div39_nodes.forEach(detach_dev);
    			t36 = claim_space(div41_nodes);
    			div40 = claim_element(div41_nodes, "DIV", { class: true });
    			var div40_nodes = children(div40);

    			svg11 = claim_element(
    				div40_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg11_nodes = children(svg11);
    			path24 = claim_element(svg11_nodes, "path", { d: true, fill: true }, 1);
    			children(path24).forEach(detach_dev);
    			svg11_nodes.forEach(detach_dev);
    			div40_nodes.forEach(detach_dev);
    			div41_nodes.forEach(detach_dev);
    			t37 = claim_space(div49_nodes);
    			div48 = claim_element(div49_nodes, "DIV", { class: true });
    			var div48_nodes = children(div48);
    			div44 = claim_element(div48_nodes, "DIV", { class: true });
    			var div44_nodes = children(div44);
    			article6 = claim_element(div44_nodes, "ARTICLE", { class: true });
    			var article6_nodes = children(article6);
    			div43 = claim_element(article6_nodes, "DIV", { class: true });
    			var div43_nodes = children(div43);
    			div42 = claim_element(div43_nodes, "DIV", { class: true });
    			var div42_nodes = children(div42);
    			h36 = claim_element(div42_nodes, "H3", { class: true });
    			var h36_nodes = children(h36);
    			t38 = claim_text(h36_nodes, "Система обучения персонала");
    			h36_nodes.forEach(detach_dev);
    			t39 = claim_space(div42_nodes);
    			p6 = claim_element(div42_nodes, "P", { class: true });
    			var p6_nodes = children(p6);
    			t40 = claim_text(p6_nodes, "Планирование, обучение, контроль – настроенный бизнес-процесс компании, \r\n                                с помощью которого можно проводить аттестацию, формировать кадровый резерв и строить карьерную лестницу для персонала");
    			p6_nodes.forEach(detach_dev);
    			div42_nodes.forEach(detach_dev);
    			div43_nodes.forEach(detach_dev);
    			article6_nodes.forEach(detach_dev);
    			div44_nodes.forEach(detach_dev);
    			t41 = claim_space(div48_nodes);
    			div46 = claim_element(div48_nodes, "DIV", { class: true });
    			var div46_nodes = children(div46);
    			div45 = claim_element(div46_nodes, "DIV", { class: true });
    			var div45_nodes = children(div45);

    			svg12 = claim_element(
    				div45_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg12_nodes = children(svg12);

    			circle6 = claim_element(
    				svg12_nodes,
    				"circle",
    				{
    					cx: true,
    					cy: true,
    					r: true,
    					stroke: true,
    					"stroke-width": true
    				},
    				1
    			);

    			children(circle6).forEach(detach_dev);
    			svg12_nodes.forEach(detach_dev);
    			div45_nodes.forEach(detach_dev);
    			div46_nodes.forEach(detach_dev);
    			t42 = claim_space(div48_nodes);
    			div47 = claim_element(div48_nodes, "DIV", { class: true });
    			var div47_nodes = children(div47);

    			svg13 = claim_element(
    				div47_nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					xmlns: true
    				},
    				1
    			);

    			var svg13_nodes = children(svg13);
    			path25 = claim_element(svg13_nodes, "path", { d: true, fill: true }, 1);
    			children(path25).forEach(detach_dev);
    			path26 = claim_element(svg13_nodes, "path", { d: true, fill: true }, 1);
    			children(path26).forEach(detach_dev);
    			path27 = claim_element(svg13_nodes, "path", { d: true, fill: true }, 1);
    			children(path27).forEach(detach_dev);
    			path28 = claim_element(svg13_nodes, "path", { d: true, fill: true }, 1);
    			children(path28).forEach(detach_dev);
    			path29 = claim_element(svg13_nodes, "path", { d: true, fill: true }, 1);
    			children(path29).forEach(detach_dev);
    			path30 = claim_element(svg13_nodes, "path", { d: true, fill: true }, 1);
    			children(path30).forEach(detach_dev);
    			svg13_nodes.forEach(detach_dev);
    			div47_nodes.forEach(detach_dev);
    			div48_nodes.forEach(detach_dev);
    			div49_nodes.forEach(detach_dev);
    			div50_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h2, "class", "svelte-1g2jxsf");
    			add_location(h2, file$d, 60, 4, 1404);
    			attr_dev(h30, "class", "svelte-1g2jxsf");
    			add_location(h30, file$d, 67, 28, 1747);
    			attr_dev(p0, "class", "svelte-1g2jxsf");
    			add_location(p0, file$d, 68, 28, 1810);
    			attr_dev(div0, "class", "bg__color first__block_anim svelte-1g2jxsf");
    			add_location(div0, file$d, 66, 24, 1676);
    			attr_dev(div1, "class", "icon__yellow");
    			add_location(div1, file$d, 65, 20, 1624);
    			attr_dev(article0, "class", "first__block container__block svelte-1g2jxsf");
    			add_location(article0, file$d, 64, 16, 1555);
    			attr_dev(div2, "class", "col-lg-9 col-md-12");
    			add_location(div2, file$d, 63, 12, 1505);
    			attr_dev(circle0, "cx", "25");
    			attr_dev(circle0, "cy", "25");
    			attr_dev(circle0, "r", "23.5");
    			attr_dev(circle0, "stroke", "#EA8E02");
    			attr_dev(circle0, "stroke-width", "3");
    			add_location(circle0, file$d, 82, 24, 2796);
    			attr_dev(svg0, "width", "50");
    			attr_dev(svg0, "height", "50");
    			attr_dev(svg0, "viewBox", "0 0 50 50");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$d, 81, 20, 2675);
    			attr_dev(div3, "class", "ellips_yellow svelte-1g2jxsf");
    			add_location(div3, file$d, 80, 16, 2626);
    			attr_dev(div4, "class", "col-1 align-self-center remove_small_display");
    			add_location(div4, file$d, 79, 12, 2550);
    			attr_dev(path0, "d", "M146.416 56.5267L76.1039 19.0267C75.4125 18.6587 74.5898 18.6587 73.8984 19.0267L3.58594 56.5267C2.81953 56.9345 2.34375 57.7291 2.34375 58.5939C2.34375 59.4587 2.81953 60.2533 3.58359 60.6611L23.4375 71.2501V100.781H28.125V73.7509L35.1562 77.5009V91.7392C31.1227 92.7869 28.125 96.4244 28.125 100.781C28.125 102.924 28.875 104.876 30.0891 106.458C28.8094 110.834 28.125 115.345 28.125 119.911V126.563C28.125 127.451 28.6266 128.262 29.4211 128.66L32.0109 129.956C33.7078 130.802 35.6039 131.25 37.5 131.25C39.3961 131.25 41.2922 130.802 42.9891 129.954L45.5789 128.658C46.3734 128.262 46.875 127.451 46.875 126.563V119.911C46.875 115.345 46.1906 110.834 44.9109 106.458C46.125 104.876 46.875 102.924 46.875 100.781C46.875 96.4244 43.8773 92.7869 39.8438 91.7392V80.0017L73.8961 98.1634C74.243 98.3462 74.6203 98.4376 75 98.4376C75.3797 98.4376 75.757 98.3462 76.1039 98.1634L121.875 73.7509V99.6236C108.839 109.446 92.7375 114.844 76.4039 114.844H73.5984C65.5523 114.844 57.5977 113.567 49.9523 111.047L48.4875 115.5C56.6016 118.174 65.0531 119.531 73.5961 119.531H76.4016C94.1531 119.531 111.645 113.529 125.658 102.631C126.227 102.188 126.562 101.506 126.562 100.781V71.2501L146.416 60.6611C147.18 60.2533 147.656 59.4587 147.656 58.5939C147.656 57.7291 147.18 56.9345 146.416 56.5267ZM42.1875 125.114L40.8914 125.761C38.7938 126.809 36.2039 126.809 34.1063 125.761L32.8125 125.114V119.911C32.8125 116.388 33.2414 112.899 34.0875 109.491C35.1469 109.908 36.293 110.156 37.5 110.156C38.707 110.156 39.8531 109.908 40.9125 109.491C41.7586 112.899 42.1875 116.388 42.1875 119.911V125.114ZM42.1875 100.781C42.1875 103.367 40.0852 105.469 37.5 105.469C34.9148 105.469 32.8125 103.367 32.8125 100.781C32.8125 98.1962 34.9148 96.0939 37.5 96.0939C40.0852 96.0939 42.1875 98.1962 42.1875 100.781ZM75 93.4361L41.4562 75.5462L70.493 60.0611C71.8266 60.6048 73.3453 60.9376 75 60.9376C80.257 60.9376 84.375 57.8486 84.375 53.9064C84.375 49.9642 80.257 46.8751 75 46.8751C69.743 46.8751 65.625 49.9642 65.625 53.9064C65.625 54.9775 65.9508 55.9759 66.4992 56.8783L36.4758 72.8908L9.66797 58.5939L75 23.7494L140.332 58.5939L75 93.4361ZM70.3125 53.9064C70.3125 52.9501 72.1383 51.5626 75 51.5626C77.8617 51.5626 79.6875 52.9501 79.6875 53.9064C79.6875 54.8626 77.8617 56.2501 75 56.2501C72.1383 56.2501 70.3125 54.8626 70.3125 53.9064Z");
    			attr_dev(path0, "fill", "#EA8E02");
    			add_location(path0, file$d, 100, 20, 3856);
    			attr_dev(svg1, "width", "150");
    			attr_dev(svg1, "height", "150");
    			attr_dev(svg1, "viewBox", "0 0 150 150");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$d, 99, 16, 3735);
    			attr_dev(div5, "class", "col-2 align-self-center remove_small_display svg_bg");
    			add_location(div5, file$d, 98, 12, 3652);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$d, 62, 8, 1474);
    			attr_dev(h31, "class", "svelte-1g2jxsf");
    			add_location(h31, file$d, 109, 28, 6550);
    			attr_dev(p1, "class", "svelte-1g2jxsf");
    			add_location(p1, file$d, 110, 28, 6613);
    			attr_dev(div7, "class", "bg__color second__block_anim svelte-1g2jxsf");
    			add_location(div7, file$d, 108, 24, 6478);
    			attr_dev(div8, "class", "icon__blue");
    			add_location(div8, file$d, 107, 20, 6428);
    			attr_dev(article1, "class", "second__block container__block svelte-1g2jxsf");
    			add_location(article1, file$d, 106, 16, 6358);
    			attr_dev(div9, "class", "col-lg-9 col-md-12");
    			add_location(div9, file$d, 105, 12, 6308);
    			attr_dev(circle1, "cx", "25");
    			attr_dev(circle1, "cy", "25");
    			attr_dev(circle1, "r", "23.5");
    			attr_dev(circle1, "stroke", "#2C467C");
    			attr_dev(circle1, "stroke-width", "3");
    			add_location(circle1, file$d, 124, 24, 7565);
    			attr_dev(svg2, "width", "50");
    			attr_dev(svg2, "height", "50");
    			attr_dev(svg2, "viewBox", "0 0 50 50");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$d, 123, 20, 7444);
    			attr_dev(div10, "class", "ellips_blue svelte-1g2jxsf");
    			add_location(div10, file$d, 122, 16, 7397);
    			attr_dev(div11, "class", "col-1 align-self-center remove_small_display");
    			add_location(div11, file$d, 121, 12, 7321);
    			attr_dev(path1, "d", "M147.5 25H140V12.5C140 11.1194 138.881 10 137.5 10H95C85.3125 10 78.4351 12.9346 75 18.2825C71.5649 12.9346 64.6875 10 55 10H12.5C11.1194 10 10 11.1194 10 12.5V25H2.5C1.11938 25 0 26.1194 0 27.5V127.5C0 128.881 1.11938 130 2.5 130H56.3403C58.728 132.693 66.0901 140 75.647 140C82.1729 140 88.2397 136.637 93.7 130H147.5C148.881 130 150 128.881 150 127.5V27.5C150 26.1194 148.881 25 147.5 25ZM95 15H135V110H95C87.2778 110 81.3354 111.86 77.5 115.322V27.5C77.5 19.2053 83.3875 15 95 15ZM15 15H55C66.6125 15 72.5 19.2053 72.5 27.5V115.322C68.6646 111.86 62.7222 110 55 110H15V15ZM145 125H92.5C91.7285 125 90.9985 125.355 90.5249 125.966C85.8704 131.949 80.8728 135 75.6726 135H75.647C66.6479 135 59.5398 126.052 59.4702 125.962C58.9966 125.355 58.2703 125 57.5 125H5V30H10V112.5C10 113.881 11.1194 115 12.5 115H55C66.6125 115 72.5 119.205 72.5 127.5C72.5 128.881 73.6194 130 75 130C76.3806 130 77.5 128.881 77.5 127.5C77.5 119.205 83.3875 115 95 115H137.5C138.881 115 140 113.881 140 112.5V30H145V125Z");
    			attr_dev(path1, "fill", "#2C467C");
    			add_location(path1, file$d, 130, 20, 7923);
    			attr_dev(path2, "d", "M27.5 35H60C61.3806 35 62.5 33.8806 62.5 32.5C62.5 31.1194 61.3806 30 60 30H27.5C26.1194 30 25 31.1194 25 32.5C25 33.8806 26.1194 35 27.5 35Z");
    			attr_dev(path2, "fill", "#2C467C");
    			add_location(path2, file$d, 131, 20, 8970);
    			attr_dev(path3, "d", "M27.5 50H60C61.3806 50 62.5 48.8806 62.5 47.5C62.5 46.1194 61.3806 45 60 45H27.5C26.1194 45 25 46.1194 25 47.5C25 48.8806 26.1194 50 27.5 50Z");
    			attr_dev(path3, "fill", "#2C467C");
    			add_location(path3, file$d, 132, 20, 9160);
    			attr_dev(path4, "d", "M27.5 65H60C61.3806 65 62.5 63.8806 62.5 62.5C62.5 61.1194 61.3806 60 60 60H27.5C26.1194 60 25 61.1194 25 62.5C25 63.8806 26.1194 65 27.5 65Z");
    			attr_dev(path4, "fill", "#2C467C");
    			add_location(path4, file$d, 133, 20, 9350);
    			attr_dev(path5, "d", "M27.5 80H60C61.3806 80 62.5 78.8806 62.5 77.5C62.5 76.1194 61.3806 75 60 75H27.5C26.1194 75 25 76.1194 25 77.5C25 78.8806 26.1194 80 27.5 80Z");
    			attr_dev(path5, "fill", "#2C467C");
    			add_location(path5, file$d, 134, 20, 9540);
    			attr_dev(path6, "d", "M27.5 95H60C61.3806 95 62.5 93.8806 62.5 92.5C62.5 91.1194 61.3806 90 60 90H27.5C26.1194 90 25 91.1194 25 92.5C25 93.8806 26.1194 95 27.5 95Z");
    			attr_dev(path6, "fill", "#2C467C");
    			add_location(path6, file$d, 135, 20, 9730);
    			attr_dev(path7, "d", "M90 35H122.5C123.881 35 125 33.8806 125 32.5C125 31.1194 123.881 30 122.5 30H90C88.6194 30 87.5 31.1194 87.5 32.5C87.5 33.8806 88.6194 35 90 35Z");
    			attr_dev(path7, "fill", "#2C467C");
    			add_location(path7, file$d, 136, 20, 9920);
    			attr_dev(path8, "d", "M90 50H122.5C123.881 50 125 48.8806 125 47.5C125 46.1194 123.881 45 122.5 45H90C88.6194 45 87.5 46.1194 87.5 47.5C87.5 48.8806 88.6194 50 90 50Z");
    			attr_dev(path8, "fill", "#2C467C");
    			add_location(path8, file$d, 137, 20, 10113);
    			attr_dev(path9, "d", "M90 65H122.5C123.881 65 125 63.8806 125 62.5C125 61.1194 123.881 60 122.5 60H90C88.6194 60 87.5 61.1194 87.5 62.5C87.5 63.8806 88.6194 65 90 65Z");
    			attr_dev(path9, "fill", "#2C467C");
    			add_location(path9, file$d, 138, 20, 10306);
    			attr_dev(path10, "d", "M90 80H122.5C123.881 80 125 78.8806 125 77.5C125 76.1194 123.881 75 122.5 75H90C88.6194 75 87.5 76.1194 87.5 77.5C87.5 78.8806 88.6194 80 90 80Z");
    			attr_dev(path10, "fill", "#2C467C");
    			add_location(path10, file$d, 139, 20, 10499);
    			attr_dev(path11, "d", "M90 95H122.5C123.881 95 125 93.8806 125 92.5C125 91.1194 123.881 90 122.5 90H90C88.6194 90 87.5 91.1194 87.5 92.5C87.5 93.8806 88.6194 95 90 95Z");
    			attr_dev(path11, "fill", "#2C467C");
    			add_location(path11, file$d, 140, 20, 10692);
    			attr_dev(svg3, "width", "150");
    			attr_dev(svg3, "height", "150");
    			attr_dev(svg3, "viewBox", "0 0 150 150");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg3, file$d, 129, 16, 7802);
    			attr_dev(div12, "class", "col-2 align-self-center remove_small_display svg_bg");
    			add_location(div12, file$d, 128, 12, 7719);
    			attr_dev(div13, "class", "row");
    			add_location(div13, file$d, 104, 8, 6277);
    			attr_dev(h32, "class", "svelte-1g2jxsf");
    			add_location(h32, file$d, 156, 28, 11531);
    			attr_dev(p2, "class", "svelte-1g2jxsf");
    			add_location(p2, file$d, 157, 28, 11587);
    			attr_dev(div14, "class", "bg__color thirty__block_anim svelte-1g2jxsf");
    			add_location(div14, file$d, 155, 24, 11459);
    			attr_dev(div15, "class", "icon__yellow");
    			add_location(div15, file$d, 154, 20, 11407);
    			attr_dev(article2, "class", "thirty__block container__block svelte-1g2jxsf");
    			add_location(article2, file$d, 153, 16, 11337);
    			attr_dev(div16, "class", "col-lg-9 col-md-12");
    			add_location(div16, file$d, 152, 12, 11287);
    			attr_dev(circle2, "cx", "25");
    			attr_dev(circle2, "cy", "25");
    			attr_dev(circle2, "r", "23.5");
    			attr_dev(circle2, "stroke", "#EA8E02");
    			attr_dev(circle2, "stroke-width", "3");
    			add_location(circle2, file$d, 169, 24, 12396);
    			attr_dev(svg4, "width", "50");
    			attr_dev(svg4, "height", "50");
    			attr_dev(svg4, "viewBox", "0 0 50 50");
    			attr_dev(svg4, "fill", "none");
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg4, file$d, 168, 20, 12275);
    			attr_dev(div17, "class", "ellips_yellow svelte-1g2jxsf");
    			add_location(div17, file$d, 167, 16, 12226);
    			attr_dev(div18, "class", "col-1 align-self-center remove_small_display");
    			add_location(div18, file$d, 166, 12, 12150);
    			attr_dev(path12, "d", "M130.193 83.0463C127.883 80.3765 125.282 77.6847 122.434 75.0002C125.282 72.3157 127.883 69.6238 130.193 66.954C135.008 61.3899 138.353 56.1703 140.136 51.4398C142.196 45.9702 142.135 41.2802 139.952 37.5001C137.77 33.7199 133.739 31.3215 127.972 30.3714C122.984 29.5497 116.791 29.8367 109.565 31.2244C106.098 31.8904 102.466 32.7967 98.717 33.9214C97.8972 30.4534 96.9682 27.163 95.9355 24.0839C97.5403 22.5548 98.5434 20.3999 98.5434 18.0135C98.5434 13.3877 94.7798 9.62451 90.1543 9.62451C89.8511 9.62451 89.5519 9.64143 89.257 9.67303C88.5773 8.64188 87.8801 7.68415 87.164 6.81103C83.4573 2.29152 79.3649 0 74.9999 0C70.6349 0 66.5429 2.29152 62.8365 6.81103C59.631 10.7198 56.783 16.2267 54.3718 23.1782C53.2149 26.514 52.184 30.1122 51.2834 33.9214C47.5343 32.7967 43.9026 31.89 40.4353 31.2244C33.2092 29.8367 27.0163 29.5497 22.0284 30.3714C16.2613 31.3215 12.2306 33.7199 10.0482 37.5001C7.86589 41.2802 7.80427 45.9702 9.86498 51.4398C11.6473 56.1703 14.9923 61.3899 19.8071 66.954C22.1175 69.6238 24.7184 72.3157 27.5669 75.0002C25.8584 76.6101 24.2382 78.2229 22.718 79.8319C21.9346 79.5893 21.1023 79.458 20.24 79.458C15.6142 79.458 11.851 83.2216 11.851 87.8471C11.851 89.4235 12.2887 90.8994 13.0478 92.1604C11.7003 94.3772 10.636 96.5148 9.86498 98.5605C7.80395 104.03 7.86589 108.72 10.0482 112.5C12.2306 116.28 16.2613 118.679 22.0284 119.629C23.8794 119.933 25.896 120.086 28.0701 120.086C31.7544 120.086 35.8909 119.648 40.435 118.776C43.9022 118.11 47.5339 117.203 51.2831 116.079C52.1837 119.888 53.2145 123.486 54.3715 126.822C56.7827 133.774 59.6307 139.28 62.8362 143.189C66.5426 147.709 70.6349 150 74.9999 150C79.3649 150 83.4573 147.709 87.1637 143.189C90.3692 139.28 93.2172 133.774 95.6287 126.822C96.7856 123.486 97.8165 119.888 98.717 116.079C102.019 117.069 105.23 117.89 108.317 118.527C109.175 122.247 112.513 125.03 116.49 125.03C119.913 125.03 122.863 122.968 124.165 120.022C125.5 119.952 126.774 119.826 127.972 119.629C133.739 118.679 137.77 116.28 139.952 112.5C142.134 108.72 142.196 104.03 140.135 98.5605C138.353 93.8303 135.008 88.6104 130.193 83.0463ZM110.769 37.4946C123.062 35.1339 131.904 36.3297 134.423 40.6925C136.941 45.0553 133.556 53.3109 125.365 62.7761C123.088 65.4076 120.51 68.0656 117.672 70.7188C113.079 66.7717 107.982 62.8747 102.5 59.123C101.992 52.4997 101.166 46.1372 100.044 40.1859C103.761 39.0545 107.352 38.151 110.769 37.4946ZM85.8577 93.8057C82.2397 95.8945 78.6093 97.8461 75.0002 99.6485C71.3909 97.8461 67.7608 95.8945 64.1428 93.8057C60.5249 91.7169 57.0196 89.5487 53.6541 87.3242C53.4105 83.2973 53.2854 79.1778 53.2854 74.9998C53.2854 70.8219 53.4105 66.7024 53.6541 62.6755C57.0196 60.451 60.5249 58.283 64.1428 56.1939C67.7608 54.1051 71.3912 52.1536 75.0002 50.3512C78.6096 52.1536 82.2397 54.1051 85.8577 56.1939C89.4756 58.2827 92.9809 60.451 96.3464 62.6755C96.5899 66.7024 96.7151 70.8219 96.7151 74.9998C96.7151 79.1778 96.5899 83.2973 96.3464 87.3242C92.9809 89.549 89.476 91.7169 85.8577 93.8057ZM95.6916 95.3365C95.245 99.6479 94.6553 103.814 93.93 107.788C90.1259 106.429 86.2232 104.857 82.2662 103.088C84.5287 101.889 86.7924 100.638 89.0501 99.3353C91.3078 98.0319 93.5227 96.6968 95.6916 95.3365ZM67.734 103.088C63.777 104.857 59.8742 106.429 56.0702 107.788C55.3452 103.814 54.7552 99.6479 54.3086 95.3365C56.4778 96.6968 58.6927 98.0319 60.9501 99.3353C63.2078 100.638 65.4715 101.889 67.734 103.088ZM47.0423 82.751C43.5319 80.2086 40.2191 77.6147 37.1401 74.9998C40.2191 72.3849 43.5322 69.7911 47.0423 67.2486C46.9488 69.8074 46.9002 72.3932 46.9002 74.9998C46.9002 77.6064 46.9491 80.1926 47.0423 82.751ZM54.3086 54.6635C54.7552 50.3524 55.3448 46.1863 56.0702 42.2121C59.8742 43.5711 63.777 45.1434 67.734 46.9123C65.4715 48.1107 63.2078 49.3615 60.9501 50.6647C58.6927 51.9681 56.4778 53.3035 54.3086 54.6635ZM82.2662 46.9123C86.2232 45.1434 90.1259 43.5711 93.93 42.2121C94.655 46.186 95.245 50.3521 95.6916 54.6635C93.5223 53.3032 91.3074 51.9681 89.0501 50.6647C86.7927 49.3615 84.529 48.1107 82.2662 46.9123ZM102.958 67.249C106.468 69.7914 109.781 72.3852 112.86 75.0002C109.781 77.6151 106.468 80.2089 102.958 82.7514C103.051 80.1926 103.1 77.6068 103.1 75.0002C103.1 72.3935 103.051 69.8077 102.958 67.249ZM60.4039 25.2706C64.5058 13.4449 69.9623 6.38484 74.9999 6.38484C77.8495 6.38484 80.8331 8.64539 83.6297 12.748C82.4644 14.1887 81.7647 16.0205 81.7647 18.0135C81.7647 22.5803 85.4331 26.3039 89.9778 26.3984C90.9636 29.3683 91.8489 32.5483 92.6282 35.9045C86.9134 37.9087 80.9902 40.3742 74.9999 43.2458C69.0097 40.3742 63.0865 37.9087 57.3717 35.9045C58.2506 32.1202 59.2635 28.5584 60.4039 25.2706ZM24.635 62.7761C16.4446 53.3109 13.0587 45.0553 15.5775 40.6925C17.2446 37.805 21.6814 36.3048 28.0557 36.3048C31.312 36.3048 35.0746 36.6965 39.2311 37.4946C42.6486 38.151 46.2394 39.0545 49.9563 40.1855C48.8345 46.1368 48.0083 52.4993 47.5001 59.1227C42.0181 62.8744 36.9214 66.7714 32.3281 70.7185C29.4904 68.0656 26.9122 65.4076 24.635 62.7761ZM39.2314 112.505C26.9393 114.866 18.0966 113.671 15.5778 109.307C13.8785 106.364 14.8704 101.648 18.2074 95.9858C18.8587 96.1487 19.539 96.2361 20.24 96.2361C24.8658 96.2361 28.6291 92.4726 28.6291 87.8468C28.6291 86.4261 28.2728 85.0876 27.6471 83.9134C29.115 82.3718 30.6764 80.8257 32.3284 79.2809C36.9214 83.228 42.0184 87.1246 47.5001 90.8767C48.0083 97.5003 48.8345 103.863 49.9563 109.814C46.2397 110.946 42.6489 111.849 39.2314 112.505ZM89.5963 124.729C85.4944 136.555 80.0379 143.615 75.0002 143.615C69.9626 143.615 64.5061 136.555 60.4042 124.729C59.2638 121.442 58.2509 117.88 57.372 114.095C63.0868 112.091 69.01 109.626 75.0002 106.754C80.9905 109.626 86.9137 112.091 92.6285 114.095C91.7496 117.88 90.7366 121.442 89.5963 124.729ZM134.423 109.307C132.971 111.822 129.416 113.282 124.314 113.618C123.098 110.482 120.05 108.251 116.49 108.251C113.485 108.251 110.844 109.841 109.363 112.222C106.371 111.598 103.254 110.791 100.044 109.814C101.166 103.863 101.992 97.5003 102.5 90.877C107.982 87.1253 113.079 83.2286 117.672 79.2812C120.51 81.9344 123.088 84.5924 125.365 87.2239C133.556 96.6894 136.941 104.945 134.423 109.307Z");
    			attr_dev(path12, "fill", "#EA8E02");
    			add_location(path12, file$d, 176, 20, 12803);
    			attr_dev(path13, "d", "M75.0003 61.752C67.6954 61.752 61.7524 67.695 61.7524 75.0002C61.7524 82.3054 67.6954 88.2484 75.0003 88.2484C82.3052 88.2484 88.2486 82.3054 88.2486 75.0002C88.2486 67.695 82.3055 61.752 75.0003 61.752ZM75.0003 81.8632C71.216 81.8632 68.1373 78.7845 68.1373 74.9999C68.1373 71.2152 71.216 68.1365 75.0003 68.1365C78.7846 68.1365 81.8637 71.2152 81.8637 74.9999C81.8637 78.7845 78.7849 81.8632 75.0003 81.8632Z");
    			attr_dev(path13, "fill", "#EA8E02");
    			add_location(path13, file$d, 177, 20, 18955);
    			attr_dev(g0, "clip-path", "url(#clip0)");
    			add_location(g0, file$d, 175, 20, 12754);
    			attr_dev(rect0, "width", "150");
    			attr_dev(rect0, "height", "150");
    			attr_dev(rect0, "fill", "white");
    			add_location(rect0, file$d, 181, 20, 19511);
    			attr_dev(clipPath0, "id", "clip0");
    			add_location(clipPath0, file$d, 180, 20, 19468);
    			add_location(defs0, file$d, 179, 20, 19440);
    			attr_dev(svg5, "width", "150");
    			attr_dev(svg5, "height", "150");
    			attr_dev(svg5, "viewBox", "0 0 150 150");
    			attr_dev(svg5, "fill", "none");
    			attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg5, file$d, 174, 16, 12633);
    			attr_dev(div19, "class", "col-2 align-self-center remove_small_display svg_bg");
    			add_location(div19, file$d, 173, 12, 12550);
    			attr_dev(div20, "class", "row");
    			add_location(div20, file$d, 151, 8, 11256);
    			attr_dev(h33, "class", "svelte-1g2jxsf");
    			add_location(h33, file$d, 199, 28, 20278);
    			attr_dev(p3, "class", "svelte-1g2jxsf");
    			add_location(p3, file$d, 200, 28, 20334);
    			attr_dev(div21, "class", "bg__color fouty__block_anim svelte-1g2jxsf");
    			add_location(div21, file$d, 198, 24, 20207);
    			attr_dev(div22, "class", "icon__blue");
    			add_location(div22, file$d, 197, 20, 20157);
    			attr_dev(article3, "class", "fouty__block container__block svelte-1g2jxsf");
    			add_location(article3, file$d, 196, 16, 20088);
    			attr_dev(div23, "class", "col-lg-9 col-md-12");
    			add_location(div23, file$d, 195, 12, 20038);
    			attr_dev(circle3, "cx", "25");
    			attr_dev(circle3, "cy", "25");
    			attr_dev(circle3, "r", "23.5");
    			attr_dev(circle3, "stroke", "#2C467C");
    			attr_dev(circle3, "stroke-width", "3");
    			add_location(circle3, file$d, 214, 24, 21263);
    			attr_dev(svg6, "width", "50");
    			attr_dev(svg6, "height", "50");
    			attr_dev(svg6, "viewBox", "0 0 50 50");
    			attr_dev(svg6, "fill", "none");
    			attr_dev(svg6, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg6, file$d, 213, 20, 21142);
    			attr_dev(div24, "class", "ellips_blue svelte-1g2jxsf");
    			add_location(div24, file$d, 212, 16, 21095);
    			attr_dev(div25, "class", "col-1 align-self-center remove_small_display");
    			add_location(div25, file$d, 211, 12, 21019);
    			attr_dev(path14, "d", "M118.889 6.47131H106.36C105.044 2.70779 101.459 0 97.252 0H52.7466C48.5395 0 44.955 2.70779 43.6387 6.47131H31.1114C24.5512 6.47131 19.2141 11.8084 19.2141 18.3686V138.103C19.2141 144.663 24.5512 150 31.1114 150H118.889C125.449 150 130.786 144.663 130.786 138.103V18.3686C130.786 11.8084 125.449 6.47131 118.889 6.47131ZM43.3958 25.3737C44.4572 29.5482 48.2468 32.6452 52.7466 32.6452H97.252C101.752 32.6452 105.541 29.5482 106.603 25.3737H110.602V113.719H39.3941V25.3737H43.3958ZM49.7806 9.64783C49.7806 8.01213 51.1109 6.68178 52.7466 6.68178H97.252C98.8877 6.68178 100.218 8.01246 100.218 9.64783V22.9974C100.218 24.6331 98.8877 25.9634 97.252 25.9634H52.7466C51.1109 25.9634 49.7806 24.6331 49.7806 22.9974V9.64783ZM124.104 138.103C124.104 140.979 121.764 143.318 118.889 143.318H31.1114C28.2355 143.318 25.8959 140.979 25.8959 138.103V18.3686C25.8959 15.4927 28.2355 13.1531 31.1114 13.1531H43.0988V18.692H36.0532C34.208 18.692 32.7123 20.1877 32.7123 22.0328V117.059C32.7123 118.905 34.208 120.4 36.0532 120.4H113.943C115.789 120.4 117.284 118.905 117.284 117.059V22.0328C117.284 20.1877 115.789 18.692 113.943 18.692H106.9V13.1531H118.889C121.765 13.1531 124.104 15.4927 124.104 18.3686V138.103H124.104Z");
    			attr_dev(path14, "fill", "#2C467C");
    			add_location(path14, file$d, 220, 20, 21621);
    			attr_dev(path15, "d", "M59.1617 21.7406H90.837C92.6822 21.7406 94.1779 20.2449 94.1779 18.3997V15.8035C94.1779 13.9584 92.6822 12.4626 90.837 12.4626C89.2477 12.4626 87.9177 13.5722 87.5793 15.0589H62.4194C62.081 13.5722 60.751 12.4626 59.1617 12.4626C57.3165 12.4626 55.8208 13.9584 55.8208 15.8035V18.3997C55.8208 20.2449 57.3165 21.7406 59.1617 21.7406Z");
    			attr_dev(path15, "fill", "#2C467C");
    			add_location(path15, file$d, 221, 20, 22880);
    			attr_dev(path16, "d", "M62.4708 52.2826H102.058C103.904 52.2826 105.399 50.7869 105.399 48.9417C105.399 47.0965 103.904 45.6008 102.058 45.6008H62.4708C60.6256 45.6008 59.1299 47.0965 59.1299 48.9417C59.1299 50.7869 60.6256 52.2826 62.4708 52.2826Z");
    			attr_dev(path16, "fill", "#2C467C");
    			add_location(path16, file$d, 222, 20, 23262);
    			attr_dev(path17, "d", "M47.9388 52.2826H52.9501C54.7953 52.2826 56.291 50.7869 56.291 48.9417C56.291 47.0965 54.7953 45.6008 52.9501 45.6008H47.9388C46.0936 45.6008 44.5979 47.0965 44.5979 48.9417C44.5979 50.7869 46.0936 52.2826 47.9388 52.2826Z");
    			attr_dev(path17, "fill", "#2C467C");
    			add_location(path17, file$d, 223, 20, 23536);
    			attr_dev(path18, "d", "M47.9388 70.8239H52.9501C54.7953 70.8239 56.291 69.3282 56.291 67.483C56.291 65.6378 54.7953 64.1421 52.9501 64.1421H47.9388C46.0936 64.1421 44.5979 65.6378 44.5979 67.483C44.5979 69.3282 46.0936 70.8239 47.9388 70.8239Z");
    			attr_dev(path18, "fill", "#2C467C");
    			add_location(path18, file$d, 224, 20, 23807);
    			attr_dev(path19, "d", "M62.4708 70.8239H102.058C103.904 70.8239 105.399 69.3282 105.399 67.483C105.399 65.6378 103.904 64.1421 102.058 64.1421H62.4708C60.6256 64.1421 59.1299 65.6378 59.1299 67.483C59.1299 69.3282 60.6256 70.8239 62.4708 70.8239Z");
    			attr_dev(path19, "fill", "#2C467C");
    			add_location(path19, file$d, 225, 20, 24076);
    			attr_dev(path20, "d", "M47.9388 89.3649H52.9501C54.7953 89.3649 56.291 87.8692 56.291 86.024C56.291 84.1788 54.7953 82.6831 52.9501 82.6831H47.9388C46.0936 82.6831 44.5979 84.1788 44.5979 86.024C44.5979 87.8692 46.0936 89.3649 47.9388 89.3649Z");
    			attr_dev(path20, "fill", "#2C467C");
    			add_location(path20, file$d, 226, 20, 24348);
    			attr_dev(path21, "d", "M62.4708 89.3649H102.058C103.904 89.3649 105.399 87.8692 105.399 86.024C105.399 84.1788 103.904 82.6831 102.058 82.6831H62.4708C60.6256 82.6831 59.1299 84.1788 59.1299 86.024C59.1299 87.8692 60.6256 89.3649 62.4708 89.3649Z");
    			attr_dev(path21, "fill", "#2C467C");
    			add_location(path21, file$d, 227, 20, 24617);
    			attr_dev(svg7, "width", "150");
    			attr_dev(svg7, "height", "150");
    			attr_dev(svg7, "viewBox", "0 0 150 150");
    			attr_dev(svg7, "fill", "none");
    			attr_dev(svg7, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg7, file$d, 219, 16, 21500);
    			attr_dev(div26, "class", "col-2 align-self-center remove_small_display svg_bg");
    			add_location(div26, file$d, 218, 12, 21417);
    			attr_dev(div27, "class", "row");
    			add_location(div27, file$d, 194, 8, 20007);
    			attr_dev(h34, "class", "svelte-1g2jxsf");
    			add_location(h34, file$d, 243, 28, 25533);
    			attr_dev(p4, "class", "svelte-1g2jxsf");
    			add_location(p4, file$d, 244, 28, 25588);
    			attr_dev(div28, "class", "bg__color fifty__block_anim svelte-1g2jxsf");
    			add_location(div28, file$d, 242, 24, 25462);
    			attr_dev(div29, "class", "icon__yellow");
    			add_location(div29, file$d, 241, 20, 25410);
    			attr_dev(article4, "class", "fifty__block container__block svelte-1g2jxsf");
    			add_location(article4, file$d, 240, 16, 25341);
    			attr_dev(div30, "class", "col-lg-9 col-md-12");
    			add_location(div30, file$d, 239, 12, 25291);
    			attr_dev(circle4, "cx", "25");
    			attr_dev(circle4, "cy", "25");
    			attr_dev(circle4, "r", "23.5");
    			attr_dev(circle4, "stroke", "#EA8E02");
    			attr_dev(circle4, "stroke-width", "3");
    			add_location(circle4, file$d, 255, 24, 26253);
    			attr_dev(svg8, "width", "50");
    			attr_dev(svg8, "height", "50");
    			attr_dev(svg8, "viewBox", "0 0 50 50");
    			attr_dev(svg8, "fill", "none");
    			attr_dev(svg8, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg8, file$d, 254, 20, 26132);
    			attr_dev(div31, "class", "ellips_yellow svelte-1g2jxsf");
    			add_location(div31, file$d, 253, 16, 26083);
    			attr_dev(div32, "class", "col-1 align-self-center remove_small_display");
    			add_location(div32, file$d, 252, 12, 26007);
    			attr_dev(path22, "d", "M146.094 107.362C143.296 103.25 138.549 102.246 133.393 104.672L130.66 105.875C134.969 96.6908 135.504 86.4524 133.359 76.7815C130.895 65.6741 124.945 54.914 115.673 44.7998C114.853 43.9054 113.464 43.845 112.569 44.6651C111.675 45.4848 111.614 46.8743 112.434 47.7691C121.178 57.307 126.775 67.3883 129.07 77.7327C131.486 88.6291 130.08 99.8662 123.913 108.846L96.5667 120.887L96.5893 117.798C96.5899 117.72 96.5864 117.642 96.5785 117.565C95.9471 111.217 91.095 106.159 84.7789 105.266C84.7601 105.263 84.7414 105.261 84.7223 105.259L60.4173 102.46C51.0713 101.13 48.6643 95.5291 36.0069 92.3355C35.1324 84.9146 36.2981 77.0135 39.4932 69.0925C44.3052 57.1634 53.7192 45.5736 66.7698 35.4858C71.6339 38.9346 93.335 39.3638 98.1913 34.9148C100.679 36.8041 103.054 38.7512 105.266 40.722C105.684 41.0952 106.206 41.2786 106.726 41.2786C107.331 41.2786 107.933 41.0305 108.367 40.5433C109.174 39.6374 109.094 38.2488 108.188 37.4416C105.764 35.2816 103.156 33.1502 100.42 31.0904C101.061 28.3722 100.164 25.1908 97.7969 23.2971C104.676 12.8639 106.676 6.03508 103.913 2.45735C102.014 -0.000369713 99.6532 1.15305 98.6448 1.64582C96.9356 2.4802 96.0037 2.52414 94.431 1.49524C91.4307 -0.467948 88.2772 -0.531229 85.1802 1.49524C83.5876 2.53733 82.3334 2.53733 80.7415 1.49524C77.7409 -0.467948 74.5885 -0.531229 71.491 1.49524C69.9001 2.53645 68.9647 2.47199 67.2825 1.63586C66.2752 1.13518 63.9166 -0.0372839 62.0064 2.42072C59.3049 5.89768 61.1123 12.5112 67.5268 22.5896C67.1339 22.802 66.7595 23.0513 66.41 23.3361C63.8588 20.6419 59.6791 17.8321 53.6345 18.5071C48.6209 19.0681 44.924 17.4114 42.705 15.9231C41.6972 15.2481 40.3326 15.517 39.657 16.5242C38.9814 17.5321 39.2506 18.8967 40.2582 19.5723C43.0868 21.4687 47.7877 23.5798 54.122 22.8735C58.7919 22.3496 61.9607 24.7362 63.9333 27.1649C63.9063 27.2586 63.8814 27.353 63.8582 27.4473C62.1757 27.4737 59.6612 27.6307 56.892 28.2067C50.2323 29.5921 45.2887 32.7571 42.5955 37.3602C41.9829 38.4072 42.335 39.7531 43.3821 40.366C44.4294 40.9786 45.7751 40.6262 46.3876 39.5791C50.3937 32.7327 60.1721 31.8954 64.056 31.843C64.0727 31.8913 64.0923 31.9391 64.1099 31.9871C50.2501 42.6784 40.6009 54.6014 35.4189 67.4481C32.1435 75.5683 30.8351 83.7034 31.4993 91.4346C29.3925 91.1229 27.2615 90.9556 25.1202 90.9409V89.6123C25.1202 86.097 22.2602 83.2373 18.7449 83.2373H8.65972C5.14439 83.2373 2.28442 86.0973 2.28442 89.6123V140.778C2.28442 144.293 5.14439 147.153 8.65972 147.153H18.7446C22.2599 147.153 25.1199 144.293 25.1199 140.778V140.152L47.1192 148.34C50.0755 149.44 53.174 149.998 56.3284 149.998H89.1075C94.119 149.998 99.0054 148.58 103.238 145.898C146.966 118.177 144.311 119.902 144.564 119.678C148.086 116.552 148.744 111.257 146.094 107.362ZM94.0686 32.3114C86.0348 34.34 78.2237 34.34 70.1881 32.3114C66.7402 31.4399 67.7392 25.2904 71.4447 26.2197C78.6335 28.0244 85.6226 28.0244 92.8121 26.2197C96.4531 25.3057 97.5719 31.4261 94.0686 32.3114ZM65.2759 5.54553C65.2932 5.55402 65.3105 5.56281 65.3269 5.57102C68.3002 7.04875 70.9056 7.12902 73.8965 5.17229C77.6395 2.72219 78.0458 6.65061 82.9604 6.65061C85.3264 6.65061 86.6322 5.79631 87.5855 5.17229C89.1784 4.1299 90.4329 4.13049 92.0254 5.17229C95.0295 7.13811 97.5719 7.04113 100.632 5.56545C101.084 7.19494 100.061 12.0527 93.5462 21.7517C90.3113 21.6966 85.6168 24.8738 72.3271 21.9163C65.8267 12.0919 64.8215 7.18703 65.2759 5.54553ZM141.766 116.285L100.887 142.188C97.3584 144.424 93.2852 145.606 89.1078 145.606H56.3287C53.6993 145.606 51.1165 145.141 48.652 144.223L25.1199 135.465V111.806C25.1199 110.592 24.1364 109.609 22.9232 109.609C21.71 109.609 20.7265 110.592 20.7265 111.806V140.779C20.7265 141.872 19.8374 142.76 18.7449 142.76H8.65972C7.56694 142.76 6.67808 141.871 6.67808 140.779V89.6135C6.67808 88.5207 7.56694 87.6321 8.65972 87.6321H18.7446C19.8374 87.6321 20.7262 88.521 20.7262 89.6135V101.536C20.7262 102.749 21.7097 103.733 22.9229 103.733C24.1361 103.733 25.1196 102.749 25.1196 101.536V95.3358C43.2927 95.4749 47.3788 105.054 59.8293 106.815C59.8481 106.818 59.8668 106.82 59.8856 106.822L84.1894 109.62C88.4451 110.234 91.7202 113.623 92.1942 117.89L92.1637 122.069H69.4982C68.285 122.069 67.3012 123.052 67.3012 124.266C67.3012 125.479 68.2847 126.463 69.4982 126.463H94.3446C94.622 126.463 94.9425 126.401 95.2214 126.279C95.2663 126.259 135.142 108.703 135.189 108.682C138.063 107.405 140.684 107.222 142.461 109.834C143.843 111.863 143.537 114.607 141.766 116.285Z");
    			attr_dev(path22, "fill", "#EA8E02");
    			add_location(path22, file$d, 262, 20, 26660);
    			attr_dev(path23, "d", "M82.7071 99.6737C83.9203 99.6737 84.9041 98.6902 84.9041 97.4768V93.8352C91.0714 92.8344 94.6699 87.8425 95.4527 83.1855C96.4307 77.368 93.3835 72.3087 87.69 70.2963C86.6839 69.9406 85.7581 69.6005 84.9038 69.2721V55.2646C87.5027 55.6956 89.0631 57.0406 89.1768 57.1411C90.0692 57.9526 91.4502 57.8926 92.2691 57.0049C93.0917 56.1131 93.0355 54.7232 92.1437 53.9006C91.9887 53.7576 89.2981 51.3351 84.9038 50.8285V47.7043C84.9038 46.4908 83.9203 45.5073 82.7068 45.5073C81.4937 45.5073 80.5102 46.4908 80.5102 47.7043V51.0061C79.9805 51.1074 79.4379 51.2363 78.8804 51.4042C75.1538 52.5266 72.3683 55.722 71.6104 59.743C70.9228 63.3919 72.0797 66.9011 74.6294 68.9009C76.0934 70.049 77.9361 71.1002 80.5102 72.224V89.5974C77.9695 89.4898 76.4057 89.0129 73.6775 87.2281C72.6624 86.5643 71.3007 86.8482 70.6365 87.8639C69.9724 88.879 70.2568 90.2407 71.2723 90.9049C74.8585 93.251 77.2559 93.863 80.5102 93.9896V97.4768C80.5102 98.6902 81.4937 99.6737 82.7071 99.6737ZM77.3411 65.4439C76.0869 64.4601 75.5452 62.5874 75.9281 60.5568C76.2832 58.6736 77.5778 56.3855 80.1478 55.6115C80.2699 55.5746 80.39 55.543 80.5102 55.5107V67.3774C79.1947 66.7206 78.1632 66.0887 77.3411 65.4439ZM86.2257 74.4389C91.6925 76.371 91.3538 81.0649 91.1197 82.4574C90.6352 85.3405 88.5188 88.4185 84.9038 89.3448V73.9628C85.3315 74.1192 85.7684 74.2772 86.2257 74.4389Z");
    			attr_dev(path23, "fill", "#EA8E02");
    			add_location(path23, file$d, 263, 20, 31139);
    			attr_dev(g1, "clip-path", "url(#clip0)");
    			add_location(g1, file$d, 261, 20, 26611);
    			attr_dev(rect1, "width", "150");
    			attr_dev(rect1, "height", "150");
    			attr_dev(rect1, "fill", "white");
    			add_location(rect1, file$d, 267, 20, 32634);
    			attr_dev(clipPath1, "id", "clip0");
    			add_location(clipPath1, file$d, 266, 20, 32591);
    			add_location(defs1, file$d, 265, 20, 32563);
    			attr_dev(svg9, "width", "150");
    			attr_dev(svg9, "height", "150");
    			attr_dev(svg9, "viewBox", "0 0 150 150");
    			attr_dev(svg9, "fill", "none");
    			attr_dev(svg9, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg9, file$d, 260, 16, 26490);
    			attr_dev(div33, "class", "col-2 align-self-center remove_small_display svg_bg");
    			add_location(div33, file$d, 259, 12, 26407);
    			attr_dev(div34, "class", "row");
    			add_location(div34, file$d, 238, 8, 25260);
    			attr_dev(h35, "class", "svelte-1g2jxsf");
    			add_location(h35, file$d, 285, 28, 33403);
    			attr_dev(p5, "class", "svelte-1g2jxsf");
    			add_location(p5, file$d, 289, 28, 33594);
    			attr_dev(div35, "class", "bg__color sixty__block_anim svelte-1g2jxsf");
    			add_location(div35, file$d, 284, 24, 33332);
    			attr_dev(div36, "class", "icon__blue");
    			add_location(div36, file$d, 283, 20, 33282);
    			attr_dev(article5, "class", "sixty__block container__block svelte-1g2jxsf");
    			add_location(article5, file$d, 282, 16, 33213);
    			attr_dev(div37, "class", "col-lg-9 col-md-12");
    			add_location(div37, file$d, 281, 12, 33163);
    			attr_dev(circle5, "cx", "25");
    			attr_dev(circle5, "cy", "25");
    			attr_dev(circle5, "r", "23.5");
    			attr_dev(circle5, "stroke", "#2C467C");
    			attr_dev(circle5, "stroke-width", "3");
    			add_location(circle5, file$d, 301, 24, 34451);
    			attr_dev(svg10, "width", "50");
    			attr_dev(svg10, "height", "50");
    			attr_dev(svg10, "viewBox", "0 0 50 50");
    			attr_dev(svg10, "fill", "none");
    			attr_dev(svg10, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg10, file$d, 300, 20, 34330);
    			attr_dev(div38, "class", "ellips_blue svelte-1g2jxsf");
    			add_location(div38, file$d, 299, 16, 34283);
    			attr_dev(div39, "class", "col-1 align-self-center remove_small_display");
    			add_location(div39, file$d, 298, 12, 34207);
    			attr_dev(path24, "d", "M52.5 10C48.39 10 45 13.39 45 17.5V27.5C45 30.85 50.05 30.8 50 27.5V17.5C50 16.07 51.07 15 52.5 15H97.5C98.93 15 100 16.07 100 17.5V27.5C100 30.8 105 30.85 105 27.5V17.5C105 13.39 101.61 10 97.5 10H52.5ZM137.46 45C136.72 45 136.035 45.29 135.595 45.89L108.095 78.39C105.795 81.1 104.32 82.81 102.995 83.71C102.165 84.275 101.195 84.58 99.995 84.775V82.5C99.995 81.115 98.88 80 97.495 80C96.11 80 94.995 81.115 94.995 82.5V85H54.995V82.5C54.995 81.115 53.88 80 52.495 80C51.11 80 49.995 81.115 49.995 82.5V84.775C48.795 84.575 47.825 84.275 46.995 83.71C45.67 82.81 44.195 81.1 41.895 78.39L14.395 45.89C13.915 45.3 13.26 44.99 12.495 45C10.395 45 9.195 47.51 10.595 49.11L38.095 81.61C40.365 84.3 41.98 86.34 44.185 87.84C45.825 88.955 47.72 89.605 49.995 89.865V92.5C49.995 93.885 51.11 95 52.495 95C53.88 95 54.995 93.885 54.995 92.5V90H94.995V92.5C94.995 93.885 96.11 95 97.495 95C98.88 95 99.995 93.885 99.995 92.5V89.865C102.27 89.605 104.165 88.955 105.805 87.84C108.005 86.34 109.625 84.3 111.905 81.61L139.405 49.11C140.755 47.75 139.605 45 137.455 45H137.46ZM7.5 35C3.39 35 0 38.39 0 42.5V132.5C0 136.61 3.39 140 7.5 140H142.5C146.61 140 150 136.61 150 132.5V42.5C150 38.39 146.61 35 142.5 35H7.5ZM7.5 40H142.5C143.93 40 145 41.07 145 42.5V132.5C145 133.93 143.93 135 142.5 135H7.5C6.07 135 5 133.93 5 132.5V42.5C5 41.07 6.07 40 7.5 40Z");
    			attr_dev(path24, "fill", "#2C467C");
    			add_location(path24, file$d, 307, 20, 34809);
    			attr_dev(svg11, "width", "150");
    			attr_dev(svg11, "height", "150");
    			attr_dev(svg11, "viewBox", "0 0 150 150");
    			attr_dev(svg11, "fill", "none");
    			attr_dev(svg11, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg11, file$d, 306, 16, 34688);
    			attr_dev(div40, "class", "col-2 align-self-center remove_small_display svg_bg");
    			add_location(div40, file$d, 305, 12, 34605);
    			attr_dev(div41, "class", "row");
    			add_location(div41, file$d, 280, 8, 33132);
    			attr_dev(h36, "class", "svelte-1g2jxsf");
    			add_location(h36, file$d, 316, 28, 36522);
    			attr_dev(p6, "class", "svelte-1g2jxsf");
    			add_location(p6, file$d, 319, 28, 36651);
    			attr_dev(div42, "class", "bg__color sixty__block_anim svelte-1g2jxsf");
    			add_location(div42, file$d, 315, 24, 36451);
    			attr_dev(div43, "class", "icon__blue");
    			add_location(div43, file$d, 314, 20, 36401);
    			attr_dev(article6, "class", "sixty__block container__block svelte-1g2jxsf");
    			add_location(article6, file$d, 313, 16, 36332);
    			attr_dev(div44, "class", "col-lg-9 col-md-12");
    			add_location(div44, file$d, 312, 12, 36282);
    			attr_dev(circle6, "cx", "25");
    			attr_dev(circle6, "cy", "25");
    			attr_dev(circle6, "r", "23.5");
    			attr_dev(circle6, "stroke", "#EA8E02");
    			attr_dev(circle6, "stroke-width", "3");
    			add_location(circle6, file$d, 330, 24, 37313);
    			attr_dev(svg12, "width", "50");
    			attr_dev(svg12, "height", "50");
    			attr_dev(svg12, "viewBox", "0 0 50 50");
    			attr_dev(svg12, "fill", "none");
    			attr_dev(svg12, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg12, file$d, 329, 20, 37192);
    			attr_dev(div45, "class", "ellips_yellow svelte-1g2jxsf");
    			add_location(div45, file$d, 328, 16, 37143);
    			attr_dev(div46, "class", "col-1 align-self-center remove_small_display");
    			add_location(div46, file$d, 327, 12, 37067);
    			attr_dev(path25, "d", "M83.0312 145.946H66.9691C66.0417 145.942 65.1433 145.622 64.4224 145.039C63.7015 144.455 63.2012 143.644 63.0042 142.737L61.1799 134.183C54.7205 132.684 48.5526 130.129 42.9245 126.622L35.5785 131.38C34.7988 131.88 33.872 132.1 32.9508 132.002C32.0295 131.905 31.169 131.497 30.511 130.845L19.1596 119.493C18.5076 118.835 18.0992 117.975 18.0015 117.054C17.9039 116.133 18.1229 115.206 18.6224 114.426L23.3799 107.078C19.8758 101.453 17.322 95.2894 15.8211 88.8346L7.26501 87.0103C6.35602 86.8132 5.54185 86.3109 4.95775 85.5871C4.37366 84.8633 4.05482 83.9614 4.0542 83.0312V66.9691C4.05795 66.0417 4.37798 65.1433 4.9614 64.4224C5.54483 63.7015 6.35674 63.2012 7.26298 63.0042L15.817 61.1799C17.3169 54.7215 19.8707 48.5545 23.3758 42.9265L18.6204 35.5785C18.1206 34.7987 17.9013 33.8719 17.9986 32.9508C18.0958 32.0297 18.5039 31.1692 19.1556 30.511L30.5069 19.1596C31.1647 18.5073 32.0253 18.0988 32.9466 18.0015C33.8679 17.9042 34.7949 18.1239 35.5745 18.6245L42.9184 23.3819C48.5478 19.8711 54.7178 17.3131 61.1799 15.811L63.0042 7.2569C63.2024 6.35178 63.7032 5.54126 64.424 4.95903C65.1448 4.3768 66.0425 4.05764 66.9691 4.0542H83.0312C83.9586 4.05795 84.857 4.37798 85.5779 4.9614C86.2988 5.54483 86.7991 6.35674 86.9961 7.26298L88.8204 15.817C95.2798 17.3167 101.448 19.8712 107.076 23.3778L114.422 18.6204C115.201 18.1195 116.128 17.8996 117.05 17.9969C117.971 18.0942 118.832 18.5029 119.489 19.1556L130.841 30.5069C131.493 31.1649 131.901 32.0253 131.999 32.9464C132.096 33.8675 131.877 34.7944 131.378 35.5745L126.62 42.9224C130.129 48.5504 132.687 54.7182 134.189 61.1779L142.745 63.0022C143.65 63.2009 144.461 63.7021 145.043 64.4233C145.625 65.1445 145.943 66.0424 145.946 66.9691V83.0312C145.942 83.9584 145.623 84.8565 145.04 85.5774C144.457 86.2982 143.645 86.7987 142.739 86.9961L134.183 88.8204C132.682 95.2752 130.129 101.439 126.624 107.064L131.38 114.41C131.88 115.189 132.099 116.116 132.002 117.037C131.904 117.958 131.496 118.819 130.845 119.477L119.493 130.829C118.836 131.481 117.975 131.889 117.054 131.987C116.132 132.084 115.205 131.864 114.426 131.364L107.082 126.606C101.454 130.113 95.2859 132.667 88.8265 134.167L87.0022 142.721C86.8082 143.631 86.3084 144.448 85.5859 145.034C84.8635 145.621 83.9619 145.943 83.0312 145.946V145.946ZM42.9143 122.187C43.3066 122.188 43.6904 122.302 44.0191 122.516C49.8937 126.354 56.4335 129.062 63.3022 130.5C63.6871 130.58 64.0403 130.771 64.3189 131.048C64.5975 131.326 64.7893 131.678 64.8711 132.063L66.967 141.892H83.0312L85.1353 132.063C85.217 131.678 85.4089 131.326 85.6875 131.048C85.966 130.771 86.3193 130.58 86.7042 130.5C93.5729 129.062 100.113 126.354 105.987 122.516C106.316 122.302 106.699 122.189 107.091 122.189C107.483 122.189 107.866 122.302 108.195 122.516L116.633 127.989L127.985 116.637L122.512 108.199C122.298 107.87 122.185 107.487 122.185 107.095C122.185 106.703 122.298 106.32 122.512 105.991C126.35 100.117 129.059 93.5769 130.498 86.7083C130.578 86.3226 130.768 85.9685 131.045 85.6891C131.323 85.4098 131.676 85.2173 132.061 85.1353L141.892 83.0312V66.9691L132.061 64.865C131.677 64.7826 131.325 64.5904 131.049 64.3119C130.772 64.0334 130.582 63.6805 130.502 63.2961C129.063 56.4275 126.354 49.8878 122.516 44.013C122.302 43.6844 122.189 43.301 122.189 42.9093C122.189 42.5175 122.302 42.1341 122.516 41.8056L127.989 33.3691L116.637 22.0177L108.201 27.4907C107.872 27.704 107.489 27.8175 107.097 27.8175C106.705 27.8175 106.322 27.704 105.993 27.4907C100.116 23.6485 93.5715 20.9385 86.6981 19.5001C86.3143 19.4188 85.9624 19.2279 85.685 18.9505C85.4076 18.6731 85.2166 18.3211 85.1353 17.9373L83.0333 8.10825H66.9691L64.865 17.9373C64.7833 18.3219 64.5914 18.6744 64.3128 18.9519C64.0343 19.2294 63.681 19.4199 63.2961 19.5001C56.4274 20.938 49.8876 23.6459 44.013 27.4846C43.6844 27.6979 43.301 27.8114 42.9093 27.8114C42.5175 27.8114 42.1341 27.6979 41.8056 27.4846L33.367 22.0116L22.0157 33.363L27.4887 41.8015C27.702 42.1301 27.8155 42.5135 27.8155 42.9052C27.8155 43.297 27.702 43.6803 27.4887 44.0089C23.6499 49.8837 20.9413 56.4234 19.5022 63.292C19.4226 63.6777 19.2324 64.0318 18.9549 64.3112C18.6774 64.5905 18.3245 64.783 17.9393 64.865L8.10825 66.9691V83.0312L17.9393 85.1353C18.3232 85.2177 18.6748 85.4099 18.9516 85.6884C19.2283 85.9669 19.4181 86.3198 19.4981 86.7042C20.9373 93.5728 23.6458 100.113 27.4846 105.987C27.6979 106.316 27.8114 106.699 27.8114 107.091C27.8114 107.483 27.6979 107.866 27.4846 108.195L22.0116 116.631L33.363 127.983L41.7995 122.51C42.1317 122.296 42.5192 122.184 42.9143 122.187V122.187Z");
    			attr_dev(path25, "fill", "#EA8E02");
    			add_location(path25, file$d, 336, 20, 37672);
    			attr_dev(path26, "d", "M103.439 46.5204C102.921 46.5206 102.423 46.3226 102.046 45.9671C100.622 44.6258 99.0969 43.3964 97.4836 42.29C97.2645 42.1387 97.0774 41.9457 96.9329 41.7221C96.7884 41.4984 96.6894 41.2485 96.6415 40.9866C96.5936 40.7247 96.5977 40.4559 96.6537 40.1956C96.7097 39.9352 96.8164 39.6885 96.9677 39.4694C97.119 39.2504 97.312 39.0632 97.5357 38.9187C97.7593 38.7742 98.0093 38.6752 98.2712 38.6273C98.5331 38.5794 98.8019 38.5836 99.0622 38.6395C99.3225 38.6955 99.5692 38.8022 99.7883 38.9535C101.572 40.1779 103.259 41.538 104.834 43.0218C105.128 43.3008 105.332 43.6616 105.419 44.0578C105.506 44.454 105.473 44.8672 105.323 45.244C105.172 45.6208 104.913 45.9439 104.577 46.1714C104.241 46.399 103.845 46.5206 103.439 46.5204Z");
    			attr_dev(path26, "fill", "#EA8E02");
    			add_location(path26, file$d, 338, 20, 42277);
    			attr_dev(path27, "d", "M75 118.744C64.4641 118.742 54.2827 114.938 46.3267 108.031C38.3707 101.124 33.1746 91.5779 31.6934 81.1466C30.2122 70.7154 32.5452 60.1 38.2639 51.2511C43.9826 42.4023 52.7026 35.9145 62.8216 32.98C63.0805 32.8946 63.3539 32.8623 63.6255 32.885C63.8971 32.9076 64.1614 32.9849 64.4024 33.112C64.6435 33.2392 64.8565 33.4136 65.0286 33.625C65.2007 33.8363 65.3284 34.0802 65.4041 34.3421C65.4798 34.6039 65.5019 34.8783 65.4691 35.1489C65.4363 35.4195 65.3493 35.6807 65.2132 35.9169C65.0772 36.153 64.8949 36.3593 64.6772 36.5234C64.4596 36.6875 64.2111 36.8061 63.9466 36.8719C55.7017 39.2921 48.4594 44.3116 43.2992 51.1824C38.139 58.0532 35.337 66.4075 35.3108 75.0003C35.3123 80.9304 36.6427 86.7848 39.2041 92.1332C41.7655 97.4816 45.4929 102.188 50.1123 105.907C54.7316 109.625 60.1256 112.261 65.8976 113.621C71.6697 114.981 77.6731 115.031 83.4667 113.766C89.2603 112.501 94.6968 109.953 99.3767 106.311C104.056 102.669 107.861 98.0244 110.51 92.7188C113.158 87.4132 114.585 81.5814 114.684 75.6521C114.783 69.7228 113.552 63.8467 111.081 58.4557C110.97 58.2137 110.907 57.9522 110.896 57.6859C110.886 57.4197 110.928 57.154 111.02 56.904C111.112 56.6541 111.253 56.4247 111.434 56.2291C111.615 56.0334 111.832 55.8753 112.074 55.7638C112.316 55.6523 112.578 55.5895 112.844 55.579C113.11 55.5686 113.376 55.6107 113.626 55.7029C113.876 55.7952 114.105 55.9357 114.301 56.1166C114.497 56.2975 114.655 56.5151 114.766 56.7571C117.822 63.4222 119.154 70.7486 118.64 78.0629C118.125 85.3772 115.78 92.4449 111.821 98.6165C107.862 104.788 102.415 109.866 95.981 113.383C89.547 116.899 82.3324 118.743 75 118.744Z");
    			attr_dev(path27, "fill", "#EA8E02");
    			add_location(path27, file$d, 340, 20, 43077);
    			attr_dev(path28, "d", "M85.7249 36.7093C85.5435 36.7098 85.3629 36.686 85.1878 36.6384C83.3268 36.1368 81.429 35.7836 79.5121 35.5823C78.9834 35.5172 78.5015 35.2465 78.1708 34.8288C77.8401 34.4112 77.6871 33.8801 77.7449 33.3505C77.8027 32.8209 78.0667 32.3354 78.4797 31.9989C78.8927 31.6625 79.4216 31.5021 79.952 31.5526C82.0782 31.7775 84.1834 32.17 86.2479 32.7262C86.722 32.8551 87.1332 33.1517 87.4049 33.561C87.6767 33.9702 87.7906 34.4643 87.7254 34.9512C87.6603 35.4382 87.4205 35.8849 87.0506 36.2082C86.6808 36.5316 86.2061 36.7097 85.7148 36.7093H85.7249Z");
    			attr_dev(path28, "fill", "#EA8E02");
    			add_location(path28, file$d, 342, 20, 44765);
    			attr_dev(path29, "d", "M109.705 100.176C109.396 100.176 109.091 100.106 108.814 99.9709C108.536 99.8356 108.293 99.6387 108.103 99.3953C104.171 94.3722 99.1462 90.3099 93.4109 87.5163C87.6755 84.7226 81.3796 83.2708 75 83.2708C68.6205 83.2708 62.3245 84.7226 56.5892 87.5163C50.8538 90.3099 45.8295 94.3722 41.8966 99.3953C41.566 99.8195 41.0804 100.095 40.5467 100.161C40.013 100.227 39.4749 100.079 39.0507 99.748C38.6265 99.4174 38.3511 98.9318 38.2849 98.3981C38.2188 97.8644 38.3674 97.3262 38.698 96.9021C43.0103 91.3928 48.52 86.9374 54.8096 83.8733C61.0992 80.8092 68.0038 79.2168 75 79.2168C81.9963 79.2168 88.9008 80.8092 95.1904 83.8733C101.48 86.9374 106.99 91.3928 111.302 96.9021C111.536 97.2014 111.68 97.5603 111.72 97.9378C111.759 98.3154 111.692 98.6964 111.525 99.0376C111.359 99.3787 111.1 99.6663 110.778 99.8675C110.456 100.069 110.084 100.176 109.705 100.176V100.176Z");
    			attr_dev(path29, "fill", "#EA8E02");
    			add_location(path29, file$d, 344, 20, 45382);
    			attr_dev(path30, "d", "M75 83.2622C71.9009 83.2626 68.8713 82.3439 66.2943 80.6225C63.7173 78.901 61.7087 76.454 60.5224 73.5909C59.3362 70.7278 59.0256 67.5772 59.6299 64.5376C60.2343 61.498 61.7265 58.7059 63.9177 56.5144C66.109 54.3228 68.9009 52.8303 71.9404 52.2255C74.98 51.6208 78.1306 51.931 80.9938 53.1169C83.857 54.3027 86.3043 56.3111 88.0261 58.8878C89.7479 61.4646 90.6669 64.4941 90.6669 67.5932C90.6626 71.7472 89.0107 75.7299 86.0736 78.6674C83.1365 81.6049 79.154 83.2573 75 83.2622V83.2622ZM75 55.9784C72.7028 55.978 70.4569 56.6588 68.5466 57.9348C66.6363 59.2109 65.1473 61.0247 64.2679 63.147C63.3885 65.2693 63.1582 67.6048 63.6061 69.8579C64.054 72.1111 65.1601 74.1809 66.7844 75.8055C68.4086 77.4301 70.4782 78.5365 72.7313 78.9848C74.9844 79.4331 77.3199 79.2032 79.4424 78.3242C81.5648 77.4451 83.3789 75.9564 84.6553 74.0463C85.9316 72.1362 86.6129 69.8905 86.6129 67.5932C86.6097 64.5141 85.3852 61.562 83.2081 59.3846C81.0311 57.2071 78.0792 55.9821 75 55.9784V55.9784Z");
    			attr_dev(path30, "fill", "#EA8E02");
    			add_location(path30, file$d, 346, 20, 46320);
    			attr_dev(svg13, "width", "150");
    			attr_dev(svg13, "height", "150");
    			attr_dev(svg13, "viewBox", "0 0 150 150");
    			attr_dev(svg13, "fill", "white");
    			attr_dev(svg13, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg13, file$d, 335, 16, 37550);
    			attr_dev(div47, "class", "col-2 align-self-center remove_small_display svg_bg");
    			add_location(div47, file$d, 334, 12, 37467);
    			attr_dev(div48, "class", "row");
    			add_location(div48, file$d, 311, 8, 36251);
    			attr_dev(div49, "class", "container-fluid");
    			add_location(div49, file$d, 61, 4, 1435);
    			attr_dev(div50, "class", "container youGet__block svelte-1g2jxsf");
    			attr_dev(div50, "id", "youGet");
    			add_location(div50, file$d, 59, 0, 1349);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div50, anchor);
    			append_dev(div50, h2);
    			append_dev(h2, t0);
    			append_dev(div50, t1);
    			append_dev(div50, div49);
    			append_dev(div49, div6);
    			append_dev(div6, div2);
    			append_dev(div2, article0);
    			append_dev(article0, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h30);
    			append_dev(h30, t2);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(p0, t4);
    			append_dev(div6, t5);
    			append_dev(div6, div4);
    			append_dev(div4, div3);
    			append_dev(div3, svg0);
    			append_dev(svg0, circle0);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			append_dev(div5, svg1);
    			append_dev(svg1, path0);
    			append_dev(div49, t7);
    			append_dev(div49, div13);
    			append_dev(div13, div9);
    			append_dev(div9, article1);
    			append_dev(article1, div8);
    			append_dev(div8, div7);
    			append_dev(div7, h31);
    			append_dev(h31, t8);
    			append_dev(div7, t9);
    			append_dev(div7, p1);
    			append_dev(p1, t10);
    			append_dev(div13, t11);
    			append_dev(div13, div11);
    			append_dev(div11, div10);
    			append_dev(div10, svg2);
    			append_dev(svg2, circle1);
    			append_dev(div13, t12);
    			append_dev(div13, div12);
    			append_dev(div12, svg3);
    			append_dev(svg3, path1);
    			append_dev(svg3, path2);
    			append_dev(svg3, path3);
    			append_dev(svg3, path4);
    			append_dev(svg3, path5);
    			append_dev(svg3, path6);
    			append_dev(svg3, path7);
    			append_dev(svg3, path8);
    			append_dev(svg3, path9);
    			append_dev(svg3, path10);
    			append_dev(svg3, path11);
    			append_dev(div49, t13);
    			append_dev(div49, div20);
    			append_dev(div20, div16);
    			append_dev(div16, article2);
    			append_dev(article2, div15);
    			append_dev(div15, div14);
    			append_dev(div14, h32);
    			append_dev(h32, t14);
    			append_dev(div14, t15);
    			append_dev(div14, p2);
    			append_dev(p2, t16);
    			append_dev(div20, t17);
    			append_dev(div20, div18);
    			append_dev(div18, div17);
    			append_dev(div17, svg4);
    			append_dev(svg4, circle2);
    			append_dev(div20, t18);
    			append_dev(div20, div19);
    			append_dev(div19, svg5);
    			append_dev(svg5, g0);
    			append_dev(g0, path12);
    			append_dev(g0, path13);
    			append_dev(svg5, defs0);
    			append_dev(defs0, clipPath0);
    			append_dev(clipPath0, rect0);
    			append_dev(div49, t19);
    			append_dev(div49, div27);
    			append_dev(div27, div23);
    			append_dev(div23, article3);
    			append_dev(article3, div22);
    			append_dev(div22, div21);
    			append_dev(div21, h33);
    			append_dev(h33, t20);
    			append_dev(div21, t21);
    			append_dev(div21, p3);
    			append_dev(p3, t22);
    			append_dev(div27, t23);
    			append_dev(div27, div25);
    			append_dev(div25, div24);
    			append_dev(div24, svg6);
    			append_dev(svg6, circle3);
    			append_dev(div27, t24);
    			append_dev(div27, div26);
    			append_dev(div26, svg7);
    			append_dev(svg7, path14);
    			append_dev(svg7, path15);
    			append_dev(svg7, path16);
    			append_dev(svg7, path17);
    			append_dev(svg7, path18);
    			append_dev(svg7, path19);
    			append_dev(svg7, path20);
    			append_dev(svg7, path21);
    			append_dev(div49, t25);
    			append_dev(div49, div34);
    			append_dev(div34, div30);
    			append_dev(div30, article4);
    			append_dev(article4, div29);
    			append_dev(div29, div28);
    			append_dev(div28, h34);
    			append_dev(h34, t26);
    			append_dev(div28, t27);
    			append_dev(div28, p4);
    			append_dev(p4, t28);
    			append_dev(div34, t29);
    			append_dev(div34, div32);
    			append_dev(div32, div31);
    			append_dev(div31, svg8);
    			append_dev(svg8, circle4);
    			append_dev(div34, t30);
    			append_dev(div34, div33);
    			append_dev(div33, svg9);
    			append_dev(svg9, g1);
    			append_dev(g1, path22);
    			append_dev(g1, path23);
    			append_dev(svg9, defs1);
    			append_dev(defs1, clipPath1);
    			append_dev(clipPath1, rect1);
    			append_dev(div49, t31);
    			append_dev(div49, div41);
    			append_dev(div41, div37);
    			append_dev(div37, article5);
    			append_dev(article5, div36);
    			append_dev(div36, div35);
    			append_dev(div35, h35);
    			append_dev(h35, t32);
    			append_dev(div35, t33);
    			append_dev(div35, p5);
    			append_dev(p5, t34);
    			append_dev(div41, t35);
    			append_dev(div41, div39);
    			append_dev(div39, div38);
    			append_dev(div38, svg10);
    			append_dev(svg10, circle5);
    			append_dev(div41, t36);
    			append_dev(div41, div40);
    			append_dev(div40, svg11);
    			append_dev(svg11, path24);
    			append_dev(div49, t37);
    			append_dev(div49, div48);
    			append_dev(div48, div44);
    			append_dev(div44, article6);
    			append_dev(article6, div43);
    			append_dev(div43, div42);
    			append_dev(div42, h36);
    			append_dev(h36, t38);
    			append_dev(div42, t39);
    			append_dev(div42, p6);
    			append_dev(p6, t40);
    			append_dev(div48, t41);
    			append_dev(div48, div46);
    			append_dev(div46, div45);
    			append_dev(div45, svg12);
    			append_dev(svg12, circle6);
    			append_dev(div48, t42);
    			append_dev(div48, div47);
    			append_dev(div47, svg13);
    			append_dev(svg13, path25);
    			append_dev(svg13, path26);
    			append_dev(svg13, path27);
    			append_dev(svg13, path28);
    			append_dev(svg13, path29);
    			append_dev(svg13, path30);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div50);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("YouGet_test", slots, []);
    	let duration = 3000;
    	let delay = 200;
    	let visible = true;

    	// Размещать в строгом порядке с воспроизведением анимаций
    	let elemAnimation = [
    		[".blue__line__1", false],
    		[".yellow__line__1", false],
    		[".blue__line__2", false],
    		[".yellow__line__2", false],
    		[".blue__line__3", false]
    	];

    	window.addEventListener("DOMContentLoaded", function () {
    		function isVisible(elem) {
    			let windowHeight = document.documentElement.clientHeight;
    			let coords = elem.getBoundingClientRect();

    			if (coords.top > 0 && coords.top < windowHeight) {
    				return true;
    			} else {
    				return false;
    			}
    		}

    		

    		// Генерирует массив с выделенными элементами
    		function makeDocumentArray(array) {
    			let documentElemArray = [];

    			for (let i = 0; i < array.length; i++) {
    				let docTime = document.querySelector(array[i][0]);
    				documentElemArray.push(docTime);
    			}

    			return documentElemArray;
    		}

    		
    		let arrayElement = makeDocumentArray(elemAnimation);

    		window.addEventListener("scroll", function () {
    			// Проверяет массив с элементами при каждом скролле
    			let i = 0;

    			for (let elements of arrayElement) {
    				if (isVisible(elements)) {
    					elemAnimation[i][1] = true;
    				}

    				i++;
    			}
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<YouGet_test> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		draw,
    		quintOut,
    		duration,
    		delay,
    		visible,
    		elemAnimation
    	});

    	$$self.$inject_state = $$props => {
    		if ("duration" in $$props) duration = $$props.duration;
    		if ("delay" in $$props) delay = $$props.delay;
    		if ("visible" in $$props) visible = $$props.visible;
    		if ("elemAnimation" in $$props) elemAnimation = $$props.elemAnimation;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class YouGet_test extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "YouGet_test",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.29.7 */

    const { console: console_1$1 } = globals;

    const file$e = "src\\App.svelte";

    function create_fragment$e(ctx) {
    	let div;
    	let header;
    	let t0;
    	let about;
    	let t1;
    	let youcan;
    	let t2;
    	let form;
    	let t3;
    	let yougettest;
    	let t4;
    	let slider;
    	let t5;
    	let price;
    	let t6;
    	let advantage;
    	let t7;
    	let cooperative;
    	let t8;
    	let sertificat;
    	let t9;
    	let formfooter;
    	let t10;
    	let footer;
    	let t11;
    	let modal;
    	let t12;
    	let modalvertical;
    	let current;
    	header = new Header({ $$inline: true });
    	about = new AboutUs({ $$inline: true });
    	youcan = new YouCan({ $$inline: true });
    	form = new FeedbackForm({ $$inline: true });
    	yougettest = new YouGet_test({ $$inline: true });
    	slider = new Slider({ $$inline: true });
    	price = new Price({ $$inline: true });
    	advantage = new Advantage({ $$inline: true });
    	cooperative = new Cooperative({ $$inline: true });
    	sertificat = new Sertificat({ $$inline: true });
    	formfooter = new FormFooter({ $$inline: true });
    	footer = new Footer({ $$inline: true });
    	modal = new ModalPopup({ $$inline: true });
    	modalvertical = new ModalPopupVertical({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(header.$$.fragment);
    			t0 = space();
    			create_component(about.$$.fragment);
    			t1 = space();
    			create_component(youcan.$$.fragment);
    			t2 = space();
    			create_component(form.$$.fragment);
    			t3 = space();
    			create_component(yougettest.$$.fragment);
    			t4 = space();
    			create_component(slider.$$.fragment);
    			t5 = space();
    			create_component(price.$$.fragment);
    			t6 = space();
    			create_component(advantage.$$.fragment);
    			t7 = space();
    			create_component(cooperative.$$.fragment);
    			t8 = space();
    			create_component(sertificat.$$.fragment);
    			t9 = space();
    			create_component(formfooter.$$.fragment);
    			t10 = space();
    			create_component(footer.$$.fragment);
    			t11 = space();
    			create_component(modal.$$.fragment);
    			t12 = space();
    			create_component(modalvertical.$$.fragment);
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			claim_component(header.$$.fragment, div_nodes);
    			t0 = claim_space(div_nodes);
    			claim_component(about.$$.fragment, div_nodes);
    			t1 = claim_space(div_nodes);
    			claim_component(youcan.$$.fragment, div_nodes);
    			t2 = claim_space(div_nodes);
    			claim_component(form.$$.fragment, div_nodes);
    			t3 = claim_space(div_nodes);
    			claim_component(yougettest.$$.fragment, div_nodes);
    			t4 = claim_space(div_nodes);
    			claim_component(slider.$$.fragment, div_nodes);
    			t5 = claim_space(div_nodes);
    			claim_component(price.$$.fragment, div_nodes);
    			t6 = claim_space(div_nodes);
    			claim_component(advantage.$$.fragment, div_nodes);
    			t7 = claim_space(div_nodes);
    			claim_component(cooperative.$$.fragment, div_nodes);
    			t8 = claim_space(div_nodes);
    			claim_component(sertificat.$$.fragment, div_nodes);
    			t9 = claim_space(div_nodes);
    			claim_component(formfooter.$$.fragment, div_nodes);
    			t10 = claim_space(div_nodes);
    			claim_component(footer.$$.fragment, div_nodes);
    			t11 = claim_space(div_nodes);
    			claim_component(modal.$$.fragment, div_nodes);
    			t12 = claim_space(div_nodes);
    			claim_component(modalvertical.$$.fragment, div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", "container__fixed__width svelte-dblsv9");
    			add_location(div, file$e, 177, 0, 5870);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			append_dev(div, t0);
    			mount_component(about, div, null);
    			append_dev(div, t1);
    			mount_component(youcan, div, null);
    			append_dev(div, t2);
    			mount_component(form, div, null);
    			append_dev(div, t3);
    			mount_component(yougettest, div, null);
    			append_dev(div, t4);
    			mount_component(slider, div, null);
    			append_dev(div, t5);
    			mount_component(price, div, null);
    			append_dev(div, t6);
    			mount_component(advantage, div, null);
    			append_dev(div, t7);
    			mount_component(cooperative, div, null);
    			append_dev(div, t8);
    			mount_component(sertificat, div, null);
    			append_dev(div, t9);
    			mount_component(formfooter, div, null);
    			append_dev(div, t10);
    			mount_component(footer, div, null);
    			append_dev(div, t11);
    			mount_component(modal, div, null);
    			append_dev(div, t12);
    			mount_component(modalvertical, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(youcan.$$.fragment, local);
    			transition_in(form.$$.fragment, local);
    			transition_in(yougettest.$$.fragment, local);
    			transition_in(slider.$$.fragment, local);
    			transition_in(price.$$.fragment, local);
    			transition_in(advantage.$$.fragment, local);
    			transition_in(cooperative.$$.fragment, local);
    			transition_in(sertificat.$$.fragment, local);
    			transition_in(formfooter.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			transition_in(modal.$$.fragment, local);
    			transition_in(modalvertical.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(youcan.$$.fragment, local);
    			transition_out(form.$$.fragment, local);
    			transition_out(yougettest.$$.fragment, local);
    			transition_out(slider.$$.fragment, local);
    			transition_out(price.$$.fragment, local);
    			transition_out(advantage.$$.fragment, local);
    			transition_out(cooperative.$$.fragment, local);
    			transition_out(sertificat.$$.fragment, local);
    			transition_out(formfooter.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			transition_out(modal.$$.fragment, local);
    			transition_out(modalvertical.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    			destroy_component(about);
    			destroy_component(youcan);
    			destroy_component(form);
    			destroy_component(yougettest);
    			destroy_component(slider);
    			destroy_component(price);
    			destroy_component(advantage);
    			destroy_component(cooperative);
    			destroy_component(sertificat);
    			destroy_component(formfooter);
    			destroy_component(footer);
    			destroy_component(modal);
    			destroy_component(modalvertical);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	window.addEventListener("DOMContentLoaded", function () {
    		function setCursorPosition(pos, elem) {
    			elem.focus();

    			if (elem.setSelectionRange) elem.setSelectionRange(pos, pos); else if (elem.createTextRange) {
    				let range = elem.createTextRange();
    				range.collapse(true);
    				range.moveEnd("character", pos);
    				range.moveStart("character", pos);
    				range.select();
    			}
    		}

    		function mask(event) {
    			let matrix = "+7 (___) ___ __ __",
    				i = 0,
    				def = matrix.replace(/\D/g, ""),
    				val = this.value.replace(/\D/g, "");

    			if (def.length >= val.length) val = def;

    			this.value = matrix.replace(/./g, function (a) {
    				return (/[_\d]/).test(a) && i < val.length
    				? val.charAt(i++)
    				: i >= val.length ? "" : a;
    			});

    			if (event.type == "blur") {
    				if (this.value.length == 2) this.value = "";
    			} else setCursorPosition(this.value.length, this);
    		}

    		
    		let input = document.querySelectorAll("#tel");

    		for (let elements of input) {
    			elements.addEventListener("input", mask, false);
    			elements.addEventListener("focus", mask, false);
    			elements.addEventListener("blur", mask, false);
    		}
    	});

    	// /Маска телефона
    	// Создание анимаций
    	window.addEventListener("DOMContentLoaded", function () {
    		// Двумерный массив
    		// 1 - значение, блок к которму будет применяться класс анимации
    		// 2 - значение, класс анимации
    		let elemAnimation = [
    			[".about__block-1", "animation-left_block"],
    			[".about__block-2", "animation-right_block"],
    			[".about__animation-3", "animation-left_block"],
    			[".about__block-4", "animation-right_block"],
    			[".first__block", "second_animation"],
    			[".second__block", "first_animation"],
    			[".thirty__block", "third_animation"],
    			[".title_text_anim_1", "anim_1"],
    			[".title_text_anim_2", "anim_2"],
    			[".title_text_anim_3", "anim_3"],
    			[".title_text_anim_4", "anim_4"],
    			[".title_text_anim_5", "anim_5"],
    			[".first__block_anim", "animation__youGet"],
    			[".second__block_anim", "animation__youGet"],
    			[".thirty__block_anim", "animation__youGet"],
    			[".fouty__block_anim", "animation__youGet"],
    			[".fifty__block_anim", "animation__youGet"],
    			[".sixty__block_anim", "animation__youGet"]
    		];

    		// Проверяет, если элемент в поле зрения - true, инчае - false
    		function isVisible(elem) {
    			let windowHeight = document.documentElement.clientHeight;
    			let coords = elem.getBoundingClientRect();

    			if (coords.top > 0 && coords.top < windowHeight) {
    				return true;
    			} else {
    				return false;
    			}
    		}

    		

    		// Генерирует массив с выделенными элементами
    		function makeDocumentArray(array) {
    			let documentElemArray = [];

    			for (let i = 0; i < array.length; i++) {
    				let docTime = document.querySelector(array[i][0]);
    				documentElemArray.push(docTime);
    			}

    			return documentElemArray;
    		}

    		
    		let arrayElement = makeDocumentArray(elemAnimation);

    		window.addEventListener("scroll", function () {
    			// Проверяет массив с элементами при каждом скролле
    			let i = 0;

    			for (let elements of arrayElement) {
    				if (isVisible(elements)) {
    					elements.classList.add(elemAnimation[i][1]);
    				}

    				i++;
    			}
    		});
    	});

    	window.addEventListener("DOMContentLoaded", function () {
    		let formModule = document.querySelectorAll(".form__btn");

    		formModule.addEventListener("click", function (evt) {
    			evt.preventDefault();

    			let formData = {
    				name: document.querySelector("input[name=\"name\"]").value,
    				phone: document.querySelector("input[name=\"phone\"]").value,
    				email: document.querySelector("input[name=\"email\"]").value
    			};

    			let request = new XMLHttpRequest();

    			request.addEventListener("load", function () {
    				console.log(request.response);
    			});

    			request.open("POST", "/send.php");
    			request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    			request.send("name= " + encodeURIComponent(formData.name) + " phone= " + encodeURIComponent(formData.phone) + " email= " + encodeURIComponent(formData.email));
    		});
    	});

    	window.addEventListener("DOMContentLoaded", function () {
    		let formModule = document.querySelectorAll(".form_btn_popup");

    		formModule.addEventListener("click", function (evt) {
    			evt.preventDefault();

    			let formData = {
    				name: document.querySelector("input[name=\"name\"]").value,
    				secondName: document.querySelector("input[name=\"secondName\"]").value,
    				phone: document.querySelector("input[name=\"phone\"]").value,
    				email: document.querySelector("input[name=\"email\"]").value
    			};

    			let request = new XMLHttpRequest();

    			request.addEventListener("load", function () {
    				console.log(request.response);
    			});

    			request.open("POST", "/send_popup.php");
    			request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    			request.send("name= " + encodeURIComponent(formData.name) + "secondName= " + encodeURIComponent(formData.secondName) + " phone= " + encodeURIComponent(formData.phone) + " email= " + encodeURIComponent(formData.email));
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		About: AboutUs,
    		YouCan,
    		Form: FeedbackForm,
    		Slider,
    		Price,
    		Advantage,
    		Cooperative,
    		Sertificat,
    		FormFooter,
    		Footer,
    		Modal: ModalPopup,
    		ModalVertical: ModalPopupVertical,
    		YouGetTest: YouGet_test
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
