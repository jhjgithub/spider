import axios from "axios";
import restHelper from "../../api/restHelper";
import * as ipobj from "../../nslib/ipobj";

const state = {
  elements: [],
};

const getters = {
  get_all_ipobj() {},
};

const actions = {
  add_ipobj({ commit }, new_ipobj) {
    restHelper.add_ipobj(new_ipobj, function(res) {
      commit("ADD_IPOBJ", new_ipobj);
    });
  },

  del_ipobj({ commit }, delid) {
    restHelper.del_ipobj(delid, function(res) {
      commit("DEL_IPOBJ", delid);
    });
  },

  refresh_ipobj({ commit }) {
    // restHelper.refresh_ipobj(function(res) {
    //   commit("REFRESH_IPOBJ", { res });
    // });

    return new Promise((resolve, reject) => {
      var url = "http://localhost:3000/ipobjs";
      axios.get(url)
        .then(function (result) {
          // console.log(result);
          const data = result.data;
          if (result.status == 200) {
            commit("REFRESH_IPOBJ", { data });
          }
          else {
            console.log(result);
          }

          resolve(result);
        })
        .catch(function(err) {
          reject(err);
        });
    });
  },
};

const mutations = {
  ADD_IPOBJ(state, new_ipobj) {
    // res.id = state.JokeList.length > 0 ? ++state.JokeList[state.JokeList.length - 1].id : 1;
    // state.JokeList.push(res);
  },

  DEL_IPOBJ(state, delid) {
    // for (var index in state.JokeList) {
    //   if (state.JokeList[index].id === res) state.JokeList.splice(index, 1);
    // }
  },

  REFRESH_IPOBJ(state, res) {
    state.elements = res.data;
    // state.elements = init_sample_ipobj();
  },
};

export default {
  getters,
  state,
  actions,
  mutations,
};

////////////////////////////////////////

function init_sample_ipobj() {
  let ipobjset = [];

  let a = new ipobj.ipobj();
  a.id = "id-ssh-server";
  a.name = "ssh-server";
  a.desc = "SSH Server";
  a.created_date = "1549529617446";
  a.type = ipobj.iptype.range;
  a.ipaddr_ver = ipobj.ipver.v4;
  a.ipaddr_start = "204.152.188.196";
  a.ipaddr_end = "204.152.188.196";
  ipobjset.push(a);

  let b = new ipobj.ipobj();
  b.id = "id-web-server";
  b.name = "WebServer2";
  b.desc = "Web server rule";
  b.created_date = "1559929617446";
  b.type = ipobj.iptype.range;
  b.ipaddr_ver = ipobj.ipver.v4;
  b.ipaddr_start = "0.0.0.0";
  b.ipaddr_end = "0.0.0.0";
  ipobjset.push(b);

  let c = new ipobj.ipobj();
  c.id = "id-any-any";
  c.name = "Any-Any";
  c.desc = "Any network";
  c.created_date = "1539129617446";
  c.type = ipobj.iptype.range;
  c.ipaddr_ver = ipobj.ipver.v4;
  c.ipaddr_start = "0.0.0.0";
  c.ipaddr_end = "0.0.0.0";
  ipobjset.push(c);

  return ipobjset;
}
