//基于 Web IM SDK 封装的聊天室中间层示例
; (function (global, factory, namespace) {
	if (typeof exports === 'object' && typeof module !== 'undefined') {
		module.exports = factory();
	} else if (typeof define === 'function' && define.amd) {
		define(factory);
	} else {
		global[namespace] = factory();
	}
})(window, function () {
	"use strict";

	function initApp(appInfo, callbacks, modules) {
		window.RongIM = window.RongIM || {};
		modules = modules || {};
		var RongIMLib = modules.RongIMLib || window.RongIMLib;
		var RongIMClient = RongIMLib.RongIMClient;

		if (RongIM.ready) {
			callbacks.onReady && callbacks.onReady(RongIM.instance);
			callbacks.onConnected && callbacks.onConnected(RongIM.instance, RongIM.userInfo);
			return;
		} else {
			var appKey = appInfo.appKey;
			var token = appInfo.token;

			RongIMLib.RongIMClient.init(appKey);

			//开始链接
			RongIMClient.connect(token, {
				onSuccess: function (userId) {
					console.info(userId);
					RongIM.userInfo = {
						data: { userId: userId },
						status: "ok",
						info: "链接成功"
					};
					callbacks.onConnected && callbacks.onConnected(RongIM.instance, RongIM.userInfo);
				},
				onError: function (errorCode) {
					RongIM.ready = false;
					RongIM.userInfo = {
						data: {},
						status: "fail",
						info: errorCode
					};

					for (var i = 0, len = onConnectList.length; i < len; i++) {
						onConnectList[i](RongIM.instance, RongIM.userInfo);
					}
				}
			});
		}

		// 连接状态监听器
		RongIMClient.setConnectionStatusListener({
			onChanged: function (status) {
				// console.log(status);
				switch (status) {
					case RongIMLib.ConnectionStatus.CONNECTED:
						RongIM.instance = RongIMClient.getInstance();
						callbacks.onReady && callbacks.onReady(RongIM.instance);
						break;
				}
			}
		});

		RongIMClient.setOnReceiveMessageListener({
			// 接收到的消息
			onReceived: function (message) {
				updateMessage(message);
			}
		});
	}
	function updateMessage(message) {
		var t = document.getElementById("rc-message-list");
		message.content.content = RongIMEmoji.symbolToEmoji(message.content.content);
		var html = renderUI(message);
		t.innerHTML += html;
	}
	function initChatRoom(appInfo, chatRoomInfo, callbacks, modules) {
		var chatRoomId = chatRoomInfo.chatRoomId;
		var count = chatRoomInfo.count;

		window.chatRoomCallbacks = {};

		//公有云初始化
		var config = {
			//protobuf: 'https://cdn.ronghub.com/protobuf-2.3.1.min.js' //支持http(s)网络路径、本地相对路径
		};

		var initCallbacks = {
			onReady: function (_instance) {
			},
			onMessage: function (message) {
				var onMessage = callbacks.onMessage;
				if (message.conversationType == 4 && message.targetId == chatRoomId) {
					onMessage(message);
				}
			},
			onConnected: function (IM, userInfo) {
				//链接成功
				IM.joinChatRoom(chatRoomId, count, {
					onSuccess: function () {
						var chatRoom = {
							id: chatRoomId,
							currentUser: userInfo.data,
							getInfo: function (params, callbacks) {
								var order = params.order; //RongIMLib.GetChatRoomType.REVERSE;// 排序方式。
								var memberCount = params.memberCount; // 获取聊天室人数 （范围 0-20 ）

								IM.getChatRoomInfo(chatRoomId, memberCount, order, callbacks);
							},
							quit: function (callbacks) {
								IM.quitChatRoom(chatRoomId, callbacks);
							},
							sendMessage: function (content, callbacks) {
								var conversationType = RongIMLib.ConversationType.CHATROOM;
								var msg = new RongIMLib.TextMessage(content);

								IM.sendMessage(conversationType, chatRoomId, msg, callbacks);
							}
						};
						callbacks.onSuccess && callbacks.onSuccess(chatRoom);
					},
					onError: function (error) {
						callbacks.onError && callbacks.onError(error);
					}
				});
			}
		};
		initApp(appInfo, initCallbacks, config);
	}

	return {
		init: initChatRoom
	};
}, "RongChatRoom");