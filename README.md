### 1. 发消息时加密：
SHConversationViewController 中重写 willSendMessage 方法，将 messageContent 强转成 RCTextMessage，然后取 content 以 UTF-8 规则编码后加密。（以 UTF-8 规则编码是为了解决 emoji 表情解码时错误问题）

```
// SHConversationViewController 中
// 发送消息加密
- (RCMessageContent *)willSendMessage:(RCMessageContent *)messageContent {
    
    if ([messageContent isKindOfClass:[RCTextMessage class]]) {
        RCTextMessage *textMessage = (RCTextMessage*)messageContent;
        // 发送消息适配 emoji：以 UTF-8 规则编码后加密
        textMessage.content = [textMessage.content stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
        NSString *encryptString = [textMessage.content aes_encrypt:@"encryptKey"];
        textMessage.content = encryptString;
        textMessage.extra = @"加密解密的消息";
        return textMessage;
    }
    return messageContent;
}
```

### 2. 会话页面中消息展示处理
自定义展示 Cell（EncryptTextMessageCell）继承自 RCTextMessageCell，重写 sizeForMessageModel 方法，并对 RCMessageModel 解密

#### 注：需要在会话页面中 viewDidLoad 调用 super 后将 RCTextMessage 绑定到自定义 Cell 上，例如：

```
// SHConversationViewController 中
- (void)viewDidLoad {
    [super viewDidLoad];
    [self registerClass:[EncryptTextMessageCell class] forMessageClass:[RCTextMessage class]];
}
```

```
// EncryptTextMessageCell 中
+ (CGSize)sizeForMessageModel:(RCMessageModel *)model withCollectionViewWidth:(CGFloat)collectionViewWidth referenceExtraHeight:(CGFloat)extraHeight {
    return [super sizeForMessageModel:[EncryptTextMessageCell modelDecrypt:model] withCollectionViewWidth:collectionViewWidth referenceExtraHeight:extraHeight];
}

+ (RCMessageModel *)modelDecrypt:(RCMessageModel *)model {
    RCTextMessage *message = (RCTextMessage *)model.content;
    // 展示时适配 emoji：解密后以 UTF-8 规则解码
    NSString *decryptString = [[message.content aes_decrypt:@"encryptKey"] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
    if (decryptString.length > 0) {
        message.content = decryptString;
    }
    return model;
}
```


### 3. 会话列表处理
消息摘要以及本地通知需要解密显示，给 RCTextMessage 写一个 Category（RCTextMessage+Category）；
本地通知显示为明文，也就是显示的摘要

```
// RCTextMessage+Category 中
- (NSString *)conversationDigest {
    // 消息内容摘要适配 emoji：解密后以 UTF-8 规则解码
    NSString *conversationDigest = [[self.content aes_decrypt:@"encryptKey"] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
    return conversationDigest;
}
```

### 4. 远程推送处理

关闭显示远程推送内容，显示为“您有一条新消息”

```
//是否显示远程推送的内容
if ([RCIMClient sharedRCIMClient].pushProfile.isShowPushContent) {
    [[RCIMClient sharedRCIMClient].pushProfile updateShowPushContentStatus:NO success:^{
        NSLog(@"是否显示远程推送的内容设置成功");
    } error:^(RCErrorCode status) {
        NSLog(@"是否显示远程推送的内容设置失败");
    }];
}
```


#### 注：App 退到后台两分钟内收到消息为本地通知，显示为“消息的摘要内容，也就是发送的具体内容”；
#### 退到后台两分钟后以及杀死 App 为远程通知，显示为“您有一条新消息”