/*
 * @Author: syp1996 304899670@qq.com
 * @Date: 2025-06-21 22:22:33
 * @LastEditors: syp1996 304899670@qq.com
 * @LastEditTime: 2025-06-22 16:14:47
 * @FilePath: \cookbook.sidepanel-open\service-worker.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//其实 Chrome 已经内建了一套「点图标打开／再点一次关闭」的逻辑，并且它走的是浏览器原生的打开／关闭流程，就会有那个滑出的收起动画。你只要把它打开就行，不用自己去控制 enabled
chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch(console.error);
});


chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});
