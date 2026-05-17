# 单篇文稿分析报告

## 基本信息
- 标题：Processing of URSP rules in EPS when multiple S-NSSAI share a DNN
- TDoc ID：S2-2602285
- Agenda Item：6.9

## 摘要
该文稿讨论了在EPS网络中，当多个S-NSSAI共享同一DNN时，如何处理基于URSP规则的S-NSSAI选择问题。提出在PDN连接建立过程中，若UE支持URSP规则且已配置相关规则，可基于APN和URSP规则评估选择S-NSSAI，并通过PCO发送至SMF+PGW-C。SMF+PGW-C在选择S-NSSAI时需综合考虑自身支持能力、UE订阅的S-NSSAI、是否支持NSSAA功能以及运营商策略，优先选择不涉及网络切片特定认证授权的S-NSSAI，或在UE支持NSSAA的情况下允许选择受NSSAA约束的S-NSSAI。UE将选定的S-NSSAI和PLMN ID存储，并在注册时通过NAS消息上报Requested NSSAI。若SMF+PGW-C不支持PCO中提供的S-NSSAI，则根据策略选择支持该DNN和S-NSSAI的其他SMF+PGW-C。该机制影响5G与EPS互操作中的网络切片选择和用户身份认证流程，提升切片间服务连续性与安全性。
