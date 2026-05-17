# Agenda 文稿汇总报告

## 任务信息
- Meeting List：TDoc_List_Meeting_SA2#174
- Agenda Item：19.10.2
- 总文稿数：2
- 成功完成：2
- 失败数量：0

## 逐篇摘要

### 1. LS from RAN WG3: Reply LS on clarification of UAV regulation from SA WG2
- TDoc ID：S2-2601750
- 状态：done

本文稿为3GPP RAN WG3针对SA WG2关于无人机（UAV）监管要求的回复，主要在Rel-19版本中新增并完善了与空中用户设备（Aerial UE）飞行信息报告相关的NGAP协议定义。新增了“飞行信息报告控制”（Aerial-UE-FlightInformationReportingControl）信息元素，明确核心网可配置无人机飞行高度阈值、报告周期等参数，并支持启动或停止飞行信息上报，以及上报上报失败事件。同时，定义了飞行信息报告的事件类型、区域和时间戳上报机制，增强了对无人机动态飞行状态的感知能力。该修改旨在支持空中交通管理与监管需求，提升网络对UAV飞行行为的可监控性，未来可能影响无人机通信、空域管理及安全合规等应用场景。

### 2. LS from TSG RAN: Updated RAN WG3 CR in LS R3-260814 attachment
- TDoc ID：S2-2601760
- 状态：done

该文稿为3GPP TSG RAN会议中关于XnAP协议信息元素（IE）的更新内容，聚焦于增强无线接入网间控制与上报能力。主要新增并细化了“空中无人机UE飞行信息上报控制”（Aerial UE Flight Information Reporting Control）信息元素，定义了飞行高度阈值、上报周期（支持从120ms到40960ms的多种周期）及扩展字段，以支持无人机等特殊场景下的动态位置与飞行状态上报。同时，更新了位置上报信息（Location Reporting Information）结构，支持可选的附加位置信息和飞行信息扩展，提升定位与移动性管理的灵活性。此外，文档还明确了多个关键参数的取值范围和协议扩展机制，如最大小区数、区域数量、I-RNTI配置等。这些更新将增强网络对无人机、低轨卫星、高动态移动场景的感知与管理能力，为未来5G-Advanced和智能交通、空天地一体化网络提供关键支撑。
