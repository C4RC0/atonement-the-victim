import React from "react";

const AppContext = React.createContext({messages: {}, labels: {}, titles:{}, routes:{}, menus:{}, userStatusManager:null, storage: function () {}, template: null});

export default AppContext;

