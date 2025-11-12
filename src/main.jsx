import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";
import { Provider } from "react-redux";
import { store, persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { ConfigProvider } from "antd";
import { antdTheme } from "./utils/theme";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <ConfigProvider theme={antdTheme}>
        <App />
      </ConfigProvider>
    </PersistGate>
  </Provider>
);

// document.getElementById('root')
// B1: tìm tới thẻ có tên là root
// B2: render

// chương trình sẽ chạy từ thằng main
