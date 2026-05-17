# 单篇文稿分析报告

## 基本信息
- 标题：Processing of URSP rules in EPS when multiple S-NSSAI share a DNN
- TDoc ID：S2-2602289
- Agenda Item：6.9

## 摘要
该文稿讨论了在EPS网络中，当多个S-NSSAI共享同一DNN时，如何处理基于URSP规则的S-NSSAI选择问题。提出在PDN连接建立过程中，若UE支持URSP规则且已配置相关规则，可基于APN通过规则评估选择S-NSSAI，并通过PCO发送至SMF+PGW-C。SMF+PGW-C在选择S-NSSAI时需综合考虑自身支持能力、UE订阅信息、运营商策略及UE是否支持NSSAA功能，优先选择不涉及网络切片特定认证授权的S-NSSAI，或在支持条件下选择需NSSAA的切片。若SMF+PGW-C不支持PCO中提供的S-NSSAI，则根据运营商策略选择其他支持该DNN和S-NSSAI的SMF+PGW-C。该机制影响UE在EPS与5GC间移动时的切片连续性与切片身份识别，尤其在跨PLMN和漫游场景下，有助于保障切片服务的合规性与一致性。
