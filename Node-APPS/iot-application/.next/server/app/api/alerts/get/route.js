/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/alerts/get/route";
exports.ids = ["app/api/alerts/get/route"];
exports.modules = {

/***/ "(rsc)/./app/api/alerts/get/route.ts":
/*!*************************************!*\
  !*** ./app/api/alerts/get/route.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var fs_promises__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! fs/promises */ \"fs/promises\");\n/* harmony import */ var fs_promises__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(fs_promises__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\n// Helper to detect if we're in preview/dev mode\nfunction isV0Preview() {\n    return process.env.NEXT_PUBLIC_V0_PREVIEW === \"true\" || \"development\" === \"development\";\n}\n// Mock alerts for development/preview mode\nfunction getMockAlerts() {\n    return [\n        {\n            id: \"alert-1\",\n            title: \"CAN0 Interface Down\",\n            description: \"CAN0 interface is not responding\",\n            timestamp: Date.now() - 10 * 60 * 1000,\n            severity: \"high\"\n        },\n        {\n            id: \"alert-2\",\n            title: \"Temperature Sensor Warning\",\n            description: \"Temperature above threshold (42°C)\",\n            timestamp: Date.now() - 25 * 60 * 1000,\n            severity: \"medium\"\n        },\n        {\n            id: \"alert-3\",\n            title: \"New Device Connected\",\n            description: \"Temperature sensor connected via I2C\",\n            timestamp: Date.now() - 60 * 60 * 1000,\n            severity: \"info\"\n        },\n        {\n            id: \"alert-4\",\n            title: \"System Update Available\",\n            description: \"New firmware update available\",\n            timestamp: Date.now() - 3 * 60 * 60 * 1000,\n            severity: \"info\"\n        }\n    ];\n}\nasync function GET(request) {\n    try {\n        if (isV0Preview()) {\n            // In preview mode, just return mock data\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                success: true,\n                alerts: getMockAlerts()\n            });\n        }\n        // In production, get alerts from our storage\n        // Path to alerts storage file\n        const alertsFilePath = path__WEBPACK_IMPORTED_MODULE_2___default().join(process.cwd(), \"data\", \"alerts.json\");\n        try {\n            // Read current alerts\n            const alertsData = await (0,fs_promises__WEBPACK_IMPORTED_MODULE_1__.readFile)(alertsFilePath, 'utf-8').then((data)=>JSON.parse(data)).catch(()=>({\n                    alerts: []\n                }));\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                success: true,\n                alerts: alertsData.alerts\n            });\n        } catch (error) {\n            console.error(\"Error reading alerts file:\", error);\n            // If there's an error, return empty alerts\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                success: false,\n                alerts: [],\n                error: error instanceof Error ? error.message : \"Unknown error\"\n            });\n        }\n    } catch (error) {\n        console.error(\"Error fetching alerts:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            success: false,\n            alerts: [],\n            error: error instanceof Error ? error.message : \"Unknown error\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2FsZXJ0cy9nZXQvcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQXVEO0FBQ2pCO0FBQ2Y7QUFFdkIsZ0RBQWdEO0FBQ2hELFNBQVNHO0lBQ1AsT0FBT0MsUUFBUUMsR0FBRyxDQUFDQyxzQkFBc0IsS0FBSyxVQUFVRixrQkFBeUI7QUFDbkY7QUFFQSwyQ0FBMkM7QUFDM0MsU0FBU0c7SUFDUCxPQUFPO1FBQ0w7WUFDRUMsSUFBSTtZQUNKQyxPQUFPO1lBQ1BDLGFBQWE7WUFDYkMsV0FBV0MsS0FBS0MsR0FBRyxLQUFLLEtBQUssS0FBSztZQUNsQ0MsVUFBVTtRQUNaO1FBQ0E7WUFDRU4sSUFBSTtZQUNKQyxPQUFPO1lBQ1BDLGFBQWE7WUFDYkMsV0FBV0MsS0FBS0MsR0FBRyxLQUFLLEtBQUssS0FBSztZQUNsQ0MsVUFBVTtRQUNaO1FBQ0E7WUFDRU4sSUFBSTtZQUNKQyxPQUFPO1lBQ1BDLGFBQWE7WUFDYkMsV0FBV0MsS0FBS0MsR0FBRyxLQUFLLEtBQUssS0FBSztZQUNsQ0MsVUFBVTtRQUNaO1FBQ0E7WUFDRU4sSUFBSTtZQUNKQyxPQUFPO1lBQ1BDLGFBQWE7WUFDYkMsV0FBV0MsS0FBS0MsR0FBRyxLQUFLLElBQUksS0FBSyxLQUFLO1lBQ3RDQyxVQUFVO1FBQ1o7S0FDRDtBQUNIO0FBRU8sZUFBZUMsSUFBSUMsT0FBb0I7SUFDNUMsSUFBSTtRQUNGLElBQUliLGVBQWU7WUFDakIseUNBQXlDO1lBQ3pDLE9BQU9ILHFEQUFZQSxDQUFDaUIsSUFBSSxDQUFDO2dCQUN2QkMsU0FBUztnQkFDVEMsUUFBUVo7WUFDVjtRQUNGO1FBRUEsNkNBQTZDO1FBQzdDLDhCQUE4QjtRQUM5QixNQUFNYSxpQkFBaUJsQixnREFBUyxDQUFDRSxRQUFRa0IsR0FBRyxJQUFJLFFBQVE7UUFFeEQsSUFBSTtZQUNGLHNCQUFzQjtZQUN0QixNQUFNQyxhQUFhLE1BQU10QixxREFBUUEsQ0FBQ21CLGdCQUFnQixTQUMvQ0ksSUFBSSxDQUFDQyxDQUFBQSxPQUFRQyxLQUFLQyxLQUFLLENBQUNGLE9BQ3hCRyxLQUFLLENBQUMsSUFBTztvQkFBRVQsUUFBUSxFQUFFO2dCQUFDO1lBRTdCLE9BQU9uQixxREFBWUEsQ0FBQ2lCLElBQUksQ0FBQztnQkFDdkJDLFNBQVM7Z0JBQ1RDLFFBQVFJLFdBQVdKLE1BQU07WUFDM0I7UUFDRixFQUFFLE9BQU9VLE9BQU87WUFDZEMsUUFBUUQsS0FBSyxDQUFDLDhCQUE4QkE7WUFDNUMsMkNBQTJDO1lBQzNDLE9BQU83QixxREFBWUEsQ0FBQ2lCLElBQUksQ0FBQztnQkFDdkJDLFNBQVM7Z0JBQ1RDLFFBQVEsRUFBRTtnQkFDVlUsT0FBT0EsaUJBQWlCRSxRQUFRRixNQUFNRyxPQUFPLEdBQUc7WUFDbEQ7UUFDRjtJQUNGLEVBQUUsT0FBT0gsT0FBTztRQUNkQyxRQUFRRCxLQUFLLENBQUMsMEJBQTBCQTtRQUN4QyxPQUFPN0IscURBQVlBLENBQUNpQixJQUFJLENBQUM7WUFDdkJDLFNBQVM7WUFDVEMsUUFBUSxFQUFFO1lBQ1ZVLE9BQU9BLGlCQUFpQkUsUUFBUUYsTUFBTUcsT0FBTyxHQUFHO1FBQ2xELEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQ25CO0FBQ0YiLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xccm5hYm9cXERlc2t0b3BcXEVTUDMyXFxSUF9BUk1fRGV2ZWxvcG1lbnRcXE5vZGUtQVBQU1xcaW90LWFwcGxpY2F0aW9uXFxhcHBcXGFwaVxcYWxlcnRzXFxnZXRcXHJvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXF1ZXN0LCBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIlxyXG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gXCJmcy9wcm9taXNlc1wiXHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCJcclxuXHJcbi8vIEhlbHBlciB0byBkZXRlY3QgaWYgd2UncmUgaW4gcHJldmlldy9kZXYgbW9kZVxyXG5mdW5jdGlvbiBpc1YwUHJldmlldygpOiBib29sZWFuIHtcclxuICByZXR1cm4gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfVjBfUFJFVklFVyA9PT0gXCJ0cnVlXCIgfHwgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIlxyXG59XHJcblxyXG4vLyBNb2NrIGFsZXJ0cyBmb3IgZGV2ZWxvcG1lbnQvcHJldmlldyBtb2RlXHJcbmZ1bmN0aW9uIGdldE1vY2tBbGVydHMoKSB7XHJcbiAgcmV0dXJuIFtcclxuICAgIHtcclxuICAgICAgaWQ6IFwiYWxlcnQtMVwiLFxyXG4gICAgICB0aXRsZTogXCJDQU4wIEludGVyZmFjZSBEb3duXCIsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkNBTjAgaW50ZXJmYWNlIGlzIG5vdCByZXNwb25kaW5nXCIsXHJcbiAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSAtIDEwICogNjAgKiAxMDAwLCAvLyAxMCBtaW51dGVzIGFnb1xyXG4gICAgICBzZXZlcml0eTogXCJoaWdoXCIsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBpZDogXCJhbGVydC0yXCIsXHJcbiAgICAgIHRpdGxlOiBcIlRlbXBlcmF0dXJlIFNlbnNvciBXYXJuaW5nXCIsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlRlbXBlcmF0dXJlIGFib3ZlIHRocmVzaG9sZCAoNDLCsEMpXCIsXHJcbiAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSAtIDI1ICogNjAgKiAxMDAwLCAvLyAyNSBtaW51dGVzIGFnb1xyXG4gICAgICBzZXZlcml0eTogXCJtZWRpdW1cIixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIGlkOiBcImFsZXJ0LTNcIixcclxuICAgICAgdGl0bGU6IFwiTmV3IERldmljZSBDb25uZWN0ZWRcIixcclxuICAgICAgZGVzY3JpcHRpb246IFwiVGVtcGVyYXR1cmUgc2Vuc29yIGNvbm5lY3RlZCB2aWEgSTJDXCIsXHJcbiAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSAtIDYwICogNjAgKiAxMDAwLCAvLyAxIGhvdXIgYWdvXHJcbiAgICAgIHNldmVyaXR5OiBcImluZm9cIixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIGlkOiBcImFsZXJ0LTRcIixcclxuICAgICAgdGl0bGU6IFwiU3lzdGVtIFVwZGF0ZSBBdmFpbGFibGVcIixcclxuICAgICAgZGVzY3JpcHRpb246IFwiTmV3IGZpcm13YXJlIHVwZGF0ZSBhdmFpbGFibGVcIixcclxuICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpIC0gMyAqIDYwICogNjAgKiAxMDAwLCAvLyAzIGhvdXJzIGFnb1xyXG4gICAgICBzZXZlcml0eTogXCJpbmZvXCIsXHJcbiAgICB9LFxyXG4gIF1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChyZXF1ZXN0OiBOZXh0UmVxdWVzdCkge1xyXG4gIHRyeSB7XHJcbiAgICBpZiAoaXNWMFByZXZpZXcoKSkge1xyXG4gICAgICAvLyBJbiBwcmV2aWV3IG1vZGUsIGp1c3QgcmV0dXJuIG1vY2sgZGF0YVxyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgYWxlcnRzOiBnZXRNb2NrQWxlcnRzKCksXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW4gcHJvZHVjdGlvbiwgZ2V0IGFsZXJ0cyBmcm9tIG91ciBzdG9yYWdlXHJcbiAgICAvLyBQYXRoIHRvIGFsZXJ0cyBzdG9yYWdlIGZpbGVcclxuICAgIGNvbnN0IGFsZXJ0c0ZpbGVQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIFwiZGF0YVwiLCBcImFsZXJ0cy5qc29uXCIpXHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gUmVhZCBjdXJyZW50IGFsZXJ0c1xyXG4gICAgICBjb25zdCBhbGVydHNEYXRhID0gYXdhaXQgcmVhZEZpbGUoYWxlcnRzRmlsZVBhdGgsICd1dGYtOCcpXHJcbiAgICAgICAgLnRoZW4oZGF0YSA9PiBKU09OLnBhcnNlKGRhdGEpKVxyXG4gICAgICAgIC5jYXRjaCgoKSA9PiAoeyBhbGVydHM6IFtdIH0pKVxyXG5cclxuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIGFsZXJ0czogYWxlcnRzRGF0YS5hbGVydHMsXHJcbiAgICAgIH0pXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgcmVhZGluZyBhbGVydHMgZmlsZTpcIiwgZXJyb3IpXHJcbiAgICAgIC8vIElmIHRoZXJlJ3MgYW4gZXJyb3IsIHJldHVybiBlbXB0eSBhbGVydHNcclxuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBhbGVydHM6IFtdLFxyXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiVW5rbm93biBlcnJvclwiLFxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZmV0Y2hpbmcgYWxlcnRzOlwiLCBlcnJvcilcclxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBhbGVydHM6IFtdLFxyXG4gICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIlVua25vd24gZXJyb3JcIixcclxuICAgIH0sIHsgc3RhdHVzOiA1MDAgfSlcclxuICB9XHJcbn1cclxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsInJlYWRGaWxlIiwicGF0aCIsImlzVjBQcmV2aWV3IiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX1YwX1BSRVZJRVciLCJnZXRNb2NrQWxlcnRzIiwiaWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwidGltZXN0YW1wIiwiRGF0ZSIsIm5vdyIsInNldmVyaXR5IiwiR0VUIiwicmVxdWVzdCIsImpzb24iLCJzdWNjZXNzIiwiYWxlcnRzIiwiYWxlcnRzRmlsZVBhdGgiLCJqb2luIiwiY3dkIiwiYWxlcnRzRGF0YSIsInRoZW4iLCJkYXRhIiwiSlNPTiIsInBhcnNlIiwiY2F0Y2giLCJlcnJvciIsImNvbnNvbGUiLCJFcnJvciIsIm1lc3NhZ2UiLCJzdGF0dXMiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/alerts/get/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Falerts%2Fget%2Froute&page=%2Fapi%2Falerts%2Fget%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Falerts%2Fget%2Froute.ts&appDir=C%3A%5CUsers%5Crnabo%5CDesktop%5CESP32%5CRP_ARM_Development%5CNode-APPS%5Ciot-application%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Crnabo%5CDesktop%5CESP32%5CRP_ARM_Development%5CNode-APPS%5Ciot-application&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Falerts%2Fget%2Froute&page=%2Fapi%2Falerts%2Fget%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Falerts%2Fget%2Froute.ts&appDir=C%3A%5CUsers%5Crnabo%5CDesktop%5CESP32%5CRP_ARM_Development%5CNode-APPS%5Ciot-application%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Crnabo%5CDesktop%5CESP32%5CRP_ARM_Development%5CNode-APPS%5Ciot-application&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_rnabo_Desktop_ESP32_RP_ARM_Development_Node_APPS_iot_application_app_api_alerts_get_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/alerts/get/route.ts */ \"(rsc)/./app/api/alerts/get/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/alerts/get/route\",\n        pathname: \"/api/alerts/get\",\n        filename: \"route\",\n        bundlePath: \"app/api/alerts/get/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\rnabo\\\\Desktop\\\\ESP32\\\\RP_ARM_Development\\\\Node-APPS\\\\iot-application\\\\app\\\\api\\\\alerts\\\\get\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_rnabo_Desktop_ESP32_RP_ARM_Development_Node_APPS_iot_application_app_api_alerts_get_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhbGVydHMlMkZnZXQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmFsZXJ0cyUyRmdldCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmFsZXJ0cyUyRmdldCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNybmFibyU1Q0Rlc2t0b3AlNUNFU1AzMiU1Q1JQX0FSTV9EZXZlbG9wbWVudCU1Q05vZGUtQVBQUyU1Q2lvdC1hcHBsaWNhdGlvbiU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9QyUzQSU1Q1VzZXJzJTVDcm5hYm8lNUNEZXNrdG9wJTVDRVNQMzIlNUNSUF9BUk1fRGV2ZWxvcG1lbnQlNUNOb2RlLUFQUFMlNUNpb3QtYXBwbGljYXRpb24maXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ2lFO0FBQzlJO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFxVc2Vyc1xcXFxybmFib1xcXFxEZXNrdG9wXFxcXEVTUDMyXFxcXFJQX0FSTV9EZXZlbG9wbWVudFxcXFxOb2RlLUFQUFNcXFxcaW90LWFwcGxpY2F0aW9uXFxcXGFwcFxcXFxhcGlcXFxcYWxlcnRzXFxcXGdldFxcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvYWxlcnRzL2dldC9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2FsZXJ0cy9nZXRcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2FsZXJ0cy9nZXQvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxybmFib1xcXFxEZXNrdG9wXFxcXEVTUDMyXFxcXFJQX0FSTV9EZXZlbG9wbWVudFxcXFxOb2RlLUFQUFNcXFxcaW90LWFwcGxpY2F0aW9uXFxcXGFwcFxcXFxhcGlcXFxcYWxlcnRzXFxcXGdldFxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Falerts%2Fget%2Froute&page=%2Fapi%2Falerts%2Fget%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Falerts%2Fget%2Froute.ts&appDir=C%3A%5CUsers%5Crnabo%5CDesktop%5CESP32%5CRP_ARM_Development%5CNode-APPS%5Ciot-application%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Crnabo%5CDesktop%5CESP32%5CRP_ARM_Development%5CNode-APPS%5Ciot-application&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "fs/promises":
/*!******************************!*\
  !*** external "fs/promises" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("fs/promises");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Falerts%2Fget%2Froute&page=%2Fapi%2Falerts%2Fget%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Falerts%2Fget%2Froute.ts&appDir=C%3A%5CUsers%5Crnabo%5CDesktop%5CESP32%5CRP_ARM_Development%5CNode-APPS%5Ciot-application%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Crnabo%5CDesktop%5CESP32%5CRP_ARM_Development%5CNode-APPS%5Ciot-application&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();