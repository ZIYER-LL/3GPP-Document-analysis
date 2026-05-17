# 单篇文稿分析报告

## 基本信息
- 标题：Correction to URSP rule removal
- TDoc ID：S2-2602038
- Agenda Item：6.6

## 摘要
该文稿对3GPP Rel-19规范中关于PCF发起的UE策略关联终止流程进行了修正，明确在非漫游和漫游场景下的操作差异。在非漫游场景中，H-PCF由PCF直接承担，无需V-PCF参与；漫游场景下，H-PCF需与V-PCF协同请求策略关联删除。PCF在策略数据被移除后，通过Nudr_DM_Notify_Request通知UDR，并确认接收结果，随后可选择通过触发UE策略修改流程来删除UE策略，或基于默认配置更新策略。PCF还可通过Npcf_UEPolicyControl_UpdateNotify通知AMF策略关联终止，若采用默认配置则无需执行后续通知步骤。此外，在非漫游场景中，PCF需取消对NWDAF的分析订阅。该修正增强了策略管理在不同网络场景下的一致性与可操作性，对终端策略控制、网络切片管理及跨域策略协同具有实际影响。
