import * as lodash from "lodash";
import * as utils from "./utils.js";
import "./enum.js";
import { nsobj_base } from "./nsobjbase.js";

////////////////////////////////

export var ipobj_type = lodash.enum("group", "netmask", "range");
export var ipobj_ipver = lodash.enum("v4", "v6");
export var ipobj_protocol = lodash.enum("icmp=1", "tcp=6", "udp=17", "all=255");
// export var ipnode_visible = lodash.enum("none", "hide", "show");

export const ipobj_type_list = [
  { text: "Group", value: ipobj_type.group },
  { text: "Netmask", value: ipobj_type.netmask },
  { text: "Range", value: ipobj_type.range },
];

export const ipobj_ipver_list = [
  { text: "IPv4", value: ipobj_ipver.v4 },
  { text: "IPv6", value: ipobj_ipver.v6 },
];


export class ipobj extends nsobj_base {
  constructor(id) {
    super(id);
    this.type = ipobj_type.netmask;

    // for network
    this.ipaddr_ver = ipobj_ipver.v4;
    this.ipaddr_start = "";
    this.ipaddr_end = "";
    this.netmask = 0;

    // for port
    this.port_start = 0;
    this.port_end = 0;

    // for protocol
    this.protocol = 0;

    // for group
    this.children = [];

    // for internal
    this._depth = 0;
    this._parent_id = [];
    this._visible_child = [];
  }

  init_internal_data() {
    super.init_internal_data();

    this._depth = 0;
    this._parent_id = [];
    this._visible_child = [];
  }

  // handle child
  get child_len() {
    return this.children.length;
  }

  add_child(child, at_top = false) {
    child._parent_id.push(this.id);

    if (at_top) {
      this.children.unshift(child.id);
    }
    else {
      this.children.push(child.id);
    }
  }
}

///////////////////////////////////////////////

export class SubArray extends Array {
  constructor(...args) {
    super(...args);
  }
  last() {
    return this[this.length - 1];
  }
}

// export function SubArray() {
//   Array.call(this);
// }

// SubArray.prototype = Object.create(Array.prototype);

// remove_at(idx) {
//   return this.splice(idx, 1);
// }
///////////////////////////////////////////////

export class ipobjlist {
  constructor() {
    this.ipobjs = [];
  }

  push(item) {
    this.ipobjs.push(item);
  }

  remove_at(idx) {
    return this.ipobjs.splice(idx, 1);
  }

  insert_at(idx, item) {
    this.ipobjs.splice(idx, 0, item);
  }

  get_root_node(id) {
    let node = this.ipobjs.find((node) => {
      return node._depth == 0 && node.id === id;
    });

    return node;
  }

  get_node_index(node) {
    let i = this.ipobjs.findIndex((n) => {
      return n == node;
    });

    return i;
  }

  clone_item(item) {
    let idx = this.get_node_index(item);
    let n = item.clone_deep();

    // n.name = n.name + "_cloned"
    n.init_internal_data();
    n.init_created_date()
    n.init_id()

    this.insert_at(idx, n);
    this.normalize_nodes();
  }

  remove_item(ditem) {
    let len = this.ipobjs.length;
    for (let i = len - 1; i >= 0; i--) {
      let item = this.ipobjs[i];

      if (item.id == ditem.id /* && item.name == ditem.name */) {
        this.remove_at(i);
      }
      else if (item.children && item.children.length > 0) {
        item.children = item.children.filter(function (child_id) {
          return child_id !== ditem.id;
        });

        if (item._visible_child && item._visible_child.length > 0) {
          item._visible_child = item._visible_child.filter(function (child) {
            return child.id !== ditem.id;
          });
        }
      }
    }

    this.normalize_nodes();
  }

  remove_child_item(ditem) {
    if (!ditem._parent_id) {
      return;
    }

    let pid = ditem._parent_id[0];
    let parent = this.get_root_node(pid);

    parent.children = parent.children.filter(function (child_id) {
      return child_id !== ditem.id;
    });

    if (parent._visible_child && parent._visible_child.length > 0) {
      parent._visible_child = parent._visible_child.filter(function (child) {
        return child.id !== ditem.id;
      });
    }

    // utils.print_json(parent, "after child parent");

    let idx = this.get_node_index(ditem);
    this.remove_at(idx);
  }

  expand_children(parent) {
    if (parent.children.length < 1) {
      return;
    }

    let idx = this.get_node_index(parent);

    parent.children.forEach((child_id) => {
      let child_org = this.get_root_node(child_id);

      if (child_org) {
        let c = child_org.clone_deep();

        if (c) {
          c._depth = parent._depth + 1;
          c._fix_idx = -1;

          utils.array_empty(c._parent_id);
          utils.array_empty(c._visible_child);

          // set parent id
          c._parent_id.push(parent.id);
          parent._visible_child.push(c);

          // move clone at root level to be shown
          idx++;
          this.insert_at(idx, c);
        }
        else {
          console.log("no data");
        }
      }
    });

    this.normalize_nodes(parent._visible_child, parent._depth + 1);
    // print_json(parent, "expand node:");
  }

  collapse_children(parent) {
    parent._visible_child.forEach((child) => {
      if (child._visible_child.length > 0) {
        this.collapse_children(child);
      }

      let i = this.get_node_index(child);
      this.remove_at(i);
    });

    utils.array_empty(parent._visible_child);
  }

  normalize_nodes(nodes = null, depth = 0) {
    let fix_idx = 0;

    if (!nodes) {
      nodes = this.ipobjs;
    }

    // console.log("depth: %d", depth);

    nodes.forEach((node) => {
      if (node._depth == depth) {
        node._fix_idx = fix_idx.toString();
        fix_idx++;
      }
    });
  }

  toggle_child(node) {
    if (node.children == undefined || node.children.length < 1) {
      return;
    }

    let visible_child = node._visible_child;

    if (visible_child.length < 1) {
      this.expand_children(node);
    }
    else if (visible_child.length > 0) {
      this.collapse_children(node);
    }
  }

  dynamic_sort(property) {
    let sortOrder = 1;

    if (property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }

    /*
    return function (a,b) {
            if (sortOrder == -1) {
                    return b[property].localeCompare(a[property]);
            } 
            else {
                    return a[property].localeCompare(b[property]);
            }        
    }
    */

    const reA = /[^a-zA-Z]/g;
    const reN = /[^0-9]/g;

    // to properly handle mixed string with alphabet and digit
    return function (itemA, itemB) {
      let a, b;

      if (sortOrder == -1) {
        a = itemB[property];
        b = itemA[property];
      }
      else {
        a = itemA[property];
        b = itemB[property];
      }

      let aA = a.replace(reA, "");
      let bA = b.replace(reA, "");

      if (aA === bA) {
        let aN = parseInt(a.replace(reN, ""), 10);
        let bN = parseInt(b.replace(reN, ""), 10);
        if (isNaN(bN) || isNaN(bN)) {
          return a > b ? 1 : -1;
        }

        return aN === bN ? 0 : aN > bN ? 1 : -1;
      }
      else {
        return aA > bA ? 1 : -1;
      }
    }
  }

  do_sort(items, sort_by, sort_desc) {
    // console.log("--> sorting items: %d", items.length);

    let field = sort_by;

    if (sort_desc) {
      field = "-" + sort_by;
    }

    items.sort(this.dynamic_sort(field));

    items.forEach((item) => {
      if (item._visible_child && item._visible_child.length > 1) {
        this.do_sort(item._visible_child, sort_by, sort_desc);
      }
    });
  }

  remove_subnode() {
    for (var i = this.ipobjs.length; i--;) {
      if (this.ipobjs[i]._depth > 0) {
        this.remove_at(i);
      }
    }
  }

  restore_subnode(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      let idx = i;

      node._visible_child.forEach((child) => {
        if (child._visible_child.lehgth > 0) {
          this.restore_subnode(child);
        }

        idx++;
        this.insert_at(idx, child);
      });
    }
  }

  sort_data(sort_by, sort_desc) {
    //print_json(expanded_items, "current Last Status");

    this.remove_subnode();

    if (sort_by) {
      this.do_sort(this.ipobjs, sort_by, sort_desc);
    }
    else {
      this.do_sort(this.ipobjs, "_fix_idx", sort_desc);
    }

    this.restore_subnode(this.ipobjs);
  }

  apply_ipobj(ipobj) {
    let oldobj = this.get_root_node(ipobj.id);

    if (oldobj) {
      let v = oldobj._visible_child;
      oldobj.assign(ipobj);
      oldobj.visible_child = v;
      return;
    }

    let newobj = ipobj.clone_deep();
    this.unshift(newobj);
    this.normalize_nodes();
  }

}

////////////////////////////

export function init_sample_ipobj(ipobjlist) {
  let a = new ipobj();
  a.id = "id-ssh-server";
  // a.name = "ssh-server";
  a.desc = "SSH Server";
  a.created_date = "1549529617446";

  a.type = ipobj_type.range;
  a.ipaddr_ver = ipobj_ipver.v4;
  a.ipaddr_start = "204.152.188.196";
  a.ipaddr_end = "204.152.188.196";
  a.protocol = ipobj_protocol.tcp;
  a.port_start = 22;
  a.port_end = 22;

  let b = new ipobj();
  b.id = "id-web-server";
  // b.name = "WebServer2";
  b.desc = "Web server rule";
  b.created_date = "1559929617446";

  b.type = ipobj_type.range;
  b.ipaddr_ver = ipobj_ipver.v4;
  b.ipaddr_start = "0.0.0.0";
  b.ipaddr_end = "0.0.0.0";
  b.protocol = ipobj_protocol.tcp;
  b.port_start = 80;
  b.port_end = 80;

  let c = new ipobj();
  c.id = "id-any-any";
  // c.name = "Any-Any";
  c.desc = "Any network";
  c.created_date = "1539129617446";

  c.type = ipobj_type.range;
  c.ipaddr_ver = ipobj_ipver.v4;
  c.ipaddr_start = "0.0.0.0";
  c.ipaddr_end = "0.0.0.0";
  c.protocol = ipobj_protocol.all;
  c.port_start = 0;
  c.port_end = 65535;

  let d = new ipobj();
  d.id = "netobj-d";
  // d.name = "WebServer4";
  d.type = ipobj_type.range;
  d.ipaddr_ver = ipobj_ipver.v4;
  d.ipaddr_start = "192.168.1.1";
  d.ipaddr_end = "192.168.1.100";
  d.netmask = "";
  d.created_date = "1501129617446";
  d.desc = "network object 4";

  let e = new ipobj();
  e.id = "netobj-e";
  // e.name = "WebServer5";
  e.type = ipobj_type.range;
  e.ipaddr_ver = ipobj_ipver.v4;
  e.ipaddr_start = "172.1.1.1";
  e.ipaddr_end = "172.1.1.230";
  e.netmask = "";
  e.created_date = "1501229617446";
  e.desc = "network object 5";

  let f = new ipobj();
  f.id = "netobj-f";
  // f.name = "Group6";
  f.type = ipobj_type.group;
  f.ipaddr_ver = ipobj_ipver.v4;
  f.ipaddr_start = "";
  f.ipaddr_end = "";
  f.netmask = "";
  f.created_date = "1501229617446";
  f.desc = "network group 6";
  f.children = [];

  ipobjlist.push(b);
  ipobjlist.push(a);
  ipobjlist.push(c);
  ipobjlist.push(f);
  ipobjlist.push(d);
  ipobjlist.push(e);

  a.add_child(e);
  a.add_child(f);
  e.add_child(d);

  utils.print_json(a, "a");
}
