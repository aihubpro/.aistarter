/*
 Navicat Premium Dump SQL

 Source Server         : 1
 Source Server Type    : MySQL
 Source Server Version : 80300 (8.3.0)
 Source Host           : localhost:3306
 Source Schema         : aistarter

 Target Server Type    : MySQL
 Target Server Version : 80300 (8.3.0)
 File Encoding         : 65001

 Date: 17/06/2026 12:03:07
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for business_entities
-- ----------------------------
DROP TABLE IF EXISTS `business_entities`;
CREATE TABLE `business_entities`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '企业ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '企业名称',
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '企业代码',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '企业描述',
  `credit_code` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '统一社会信用代码',
  `legal_person_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '法人姓名',
  `status` tinyint NULL DEFAULT 0 COMMENT '审核状态：0-待审核，1-已审核，2-未通过',
  `reject_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '拒绝原因',
  `submit_date` datetime NOT NULL COMMENT '提交日期',
  `audit_date` datetime NULL DEFAULT NULL COMMENT '审核日期',
  `creator_id` bigint NOT NULL COMMENT '创建者用户ID',
  `creator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '创建者姓名',
  `creator_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建者邮箱',
  `bank_card` varchar(34) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '银行卡号',
  `bank_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '银行名称',
  `business_license_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '营业执照图片路径',
  `id_card_front_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '法人身份证正面图片路径',
  `id_card_back_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '法人身份证反面图片路径',
  `member_count` int NULL DEFAULT 1 COMMENT '成员数量',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `code`(`code`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '企业认证信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for business_entity_audit_logs
-- ----------------------------
DROP TABLE IF EXISTS `business_entity_audit_logs`;
CREATE TABLE `business_entity_audit_logs`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `entity_id` bigint NOT NULL COMMENT '企业ID',
  `entity_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '企业代码',
  `entity_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '企业名称',
  `audit_type` tinyint NOT NULL COMMENT '审核类型：1-创建审核，2-修改审核',
  `old_status` tinyint NULL DEFAULT NULL COMMENT '原状态',
  `new_status` tinyint NOT NULL COMMENT '新状态',
  `audit_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '审核意见',
  `auditor_id` bigint NULL DEFAULT NULL COMMENT '审核人ID',
  `auditor_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审核人姓名',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '企业审核日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for business_entity_members
-- ----------------------------
DROP TABLE IF EXISTS `business_entity_members`;
CREATE TABLE `business_entity_members`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `entity_id` bigint NOT NULL COMMENT '企业ID',
  `entity_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '企业代码（冗余存储，避免连表）',
  `entity_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '企业名称（冗余存储，避免连表）',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户姓名',
  `user_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '用户邮箱',
  `role` tinyint NULL DEFAULT 1 COMMENT '角色：0-创建者，1-普通成员',
  `join_date` datetime NOT NULL COMMENT '加入日期',
  `join_status` tinyint NULL DEFAULT 0 COMMENT '状态：0-申请加入，1-正常，2-申请退出',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '企业成员表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chat_messages
-- ----------------------------
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `chat_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '聊天室ID',
  `sender_id` bigint UNSIGNED NOT NULL COMMENT '发送者ID',
  `receiver_id` bigint UNSIGNED NOT NULL COMMENT '接收者ID',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息内容',
  `message_type` enum('text','image','file') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'text' COMMENT '消息类型',
  `is_read` tinyint(1) NULL DEFAULT 0 COMMENT '是否已读',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_chat_id`(`chat_id` ASC) USING BTREE,
  INDEX `idx_sender_id`(`sender_id` ASC) USING BTREE,
  INDEX `idx_receiver_id`(`receiver_id` ASC) USING BTREE,
  INDEX `idx_create_time`(`create_time` ASC) USING BTREE,
  INDEX `idx_chat_time`(`chat_id` ASC, `create_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 202 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '聊天消息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chat_sessions
-- ----------------------------
DROP TABLE IF EXISTS `chat_sessions`;
CREATE TABLE `chat_sessions`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `chat_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '聊天室ID',
  `user1_id` bigint UNSIGNED NOT NULL COMMENT '用户1ID',
  `user2_id` bigint UNSIGNED NOT NULL COMMENT '用户2ID',
  `last_message_id` bigint UNSIGNED NULL DEFAULT NULL COMMENT '最后一条消息ID',
  `last_message_time` timestamp NULL DEFAULT NULL COMMENT '最后消息时间',
  `user1_unread_count` int UNSIGNED NULL DEFAULT 0 COMMENT '用户1未读消息数',
  `user2_unread_count` int UNSIGNED NULL DEFAULT 0 COMMENT '用户2未读消息数',
  `user1_deleted_time` timestamp NULL DEFAULT NULL COMMENT '用户1删除时间',
  `user2_deleted_time` timestamp NULL DEFAULT NULL COMMENT '用户2删除时间',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_chat`(`user1_id` ASC, `user2_id` ASC) USING BTREE,
  INDEX `idx_chat_id`(`chat_id` ASC) USING BTREE,
  INDEX `idx_user1`(`user1_id` ASC) USING BTREE,
  INDEX `idx_user2`(`user2_id` ASC) USING BTREE,
  INDEX `idx_last_message_time`(`last_message_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '聊天会话表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for collaborator
-- ----------------------------
DROP TABLE IF EXISTS `collaborator`;
CREATE TABLE `collaborator`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `machine_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '机器码',
  `company_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '共创者（公司名）',
  `software_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '软件名称',
  `domain_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '域名',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '联系人',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `phone` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `protocol` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '协议 http或https',
  `private_key` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '私钥',
  `public_key` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '公钥',
  `coll_type` int NOT NULL DEFAULT 1 COMMENT '共创者类型：1、年度 2、永久',
  `create_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
  `expiry_time` datetime NOT NULL COMMENT '到期时间',
  `server_status` int NOT NULL DEFAULT 0 COMMENT '共创者服务器状态。0：正常 1：过期 2:异常 3：封禁 4：软件更新到主公司',
  `state` int NOT NULL DEFAULT 0 COMMENT '状态：0、正常 1、封禁',
  `ban_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封禁原因',
  `ban_end_time` datetime NULL DEFAULT NULL COMMENT '封禁结束时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2268 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comment
-- ----------------------------
DROP TABLE IF EXISTS `comment`;
CREATE TABLE `comment`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id` bigint UNSIGNED NULL DEFAULT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `project_id` bigint UNSIGNED NOT NULL,
  `project_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `likes` int UNSIGNED NULL DEFAULT 0,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `report_count` int UNSIGNED NULL DEFAULT 0 COMMENT '举报次数',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '地址',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'ip地址',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_project`(`project_id`, `project_type`) USING BTREE,
  INDEX `idx_parent_id`(`parent_id`) USING BTREE,
  INDEX `idx_user_id`(`user_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 180 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comment_likes
-- ----------------------------
DROP TABLE IF EXISTS `comment_likes`;
CREATE TABLE `comment_likes`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `comment_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_comment_user`(`comment_id`, `user_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for comment_message
-- ----------------------------
DROP TABLE IF EXISTS `comment_message`;
CREATE TABLE `comment_message`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `user_id` bigint UNSIGNED NOT NULL COMMENT '接收消息的用户ID（被评论者）',
  `commenter_id` bigint UNSIGNED NOT NULL COMMENT '评论者用户ID',
  `comment_id` bigint UNSIGNED NOT NULL COMMENT '评论ID（关联comment表）',
  `project_id` bigint UNSIGNED NOT NULL COMMENT '项目ID',
  `project_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '项目类型 0、项目 1、模型 2、插件 3、工作流 4、其他',
  `is_read` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '是否已读（0:未读 1:已读）',
  `message_type` tinyint UNSIGNED NULL DEFAULT 1 COMMENT '消息类型（1:新评论 2:回复评论）',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '消息创建时间',
  `read_time` timestamp NULL DEFAULT NULL COMMENT '已读时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 28 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '评论消息通知表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comment_reports
-- ----------------------------
DROP TABLE IF EXISTS `comment_reports`;
CREATE TABLE `comment_reports`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `comment_id` bigint UNSIGNED NOT NULL COMMENT '被举报的评论ID',
  `user_id` bigint UNSIGNED NOT NULL COMMENT '举报用户ID',
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '举报原因',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '举报详细描述',
  `status` tinyint NULL DEFAULT 0 COMMENT '处理状态：0-待处理，1-已处理（删除评论），2-已驳回',
  `admin_id` bigint UNSIGNED NULL DEFAULT NULL COMMENT '处理管理员ID',
  `handle_time` timestamp NULL DEFAULT NULL COMMENT '处理时间',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '举报时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_comment_user`(`comment_id` ASC, `user_id` ASC) USING BTREE COMMENT '同一用户对同一评论只能举报一次',
  INDEX `idx_comment_id`(`comment_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '评论举报表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for coupon
-- ----------------------------
DROP TABLE IF EXISTS `coupon`;
CREATE TABLE `coupon`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '优惠码',
  `discount_type` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '优惠类型(0、金额/1、百分比)',
  `discount_value` decimal(10, 2) NOT NULL COMMENT '优惠数值',
  `min_amount` int NULL DEFAULT 0 COMMENT '最低使用金额',
  `cashback_amount` int NULL DEFAULT 0 COMMENT '返现金额，使用该优惠码返现给申请者的金额',
  `valid_from` datetime NULL DEFAULT NULL COMMENT '生效时间',
  `valid_to` datetime NULL DEFAULT NULL COMMENT '失效时间',
  `used` tinyint(1) NULL DEFAULT 0 COMMENT '是否已使用',
  `applicant_id` int NOT NULL COMMENT '申请者ID',
  `user_id` int NULL DEFAULT NULL COMMENT '使用者ID',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '使用者名称',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `usage_time` datetime NULL DEFAULT NULL COMMENT '使用时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `code`(`code`) USING BTREE,
  UNIQUE INDEX `unique_code`(`code`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 64 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '优惠码表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for coupon_apply
-- ----------------------------
DROP TABLE IF EXISTS `coupon_apply`;
CREATE TABLE `coupon_apply`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键，自增ID',
  `applicant_id` int NOT NULL COMMENT '申请人ID',
  `applicant_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '申请人名称',
  `apply_count` int NOT NULL COMMENT '申请优惠码数量',
  `status` int NULL DEFAULT 0 COMMENT '审核状态（0、待审核/1、已通过/2、已拒绝）',
  `review_remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审核备注',
  `reviewer_id` int NULL DEFAULT NULL COMMENT '审核人ID',
  `reviewer_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审核人姓名',
  `reviewed_at` datetime NULL DEFAULT NULL COMMENT '审核时间',
  `issued_count` int NULL DEFAULT 0 COMMENT '实际发放的优惠码数量',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '优惠码申请表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for like_message
-- ----------------------------
DROP TABLE IF EXISTS `like_message`;
CREATE TABLE `like_message`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `user_id` bigint UNSIGNED NOT NULL COMMENT '接收消息的用户ID（被点赞者）',
  `liker_id` bigint UNSIGNED NOT NULL COMMENT '点赞者用户ID',
  `like_id` bigint UNSIGNED NOT NULL COMMENT '点赞ID（关联like表）',
  `content_type` tinyint UNSIGNED NOT NULL COMMENT '被点赞内容类型（1:评论 2:项目 3:图片 4:动态）',
  `project_id` bigint UNSIGNED NULL DEFAULT NULL COMMENT '项目ID（可选）',
  `project_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '项目类型 0、项目 1、模型 2、插件 3、工作流 4、其他',
  `is_read` tinyint UNSIGNED NULL DEFAULT 0 COMMENT '是否已读（0:未读 1:已读）',
  `message_type` tinyint UNSIGNED NULL DEFAULT 1 COMMENT '消息类型（1:点赞通知 2:取消点赞通知）',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '消息创建时间',
  `read_time` timestamp NULL DEFAULT NULL COMMENT '已读时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '点赞消息通知表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for pay_order
-- ----------------------------
DROP TABLE IF EXISTS `pay_order`;
CREATE TABLE `pay_order`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `biz_order_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '商户订单号',
  `order_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '支付订单号',
  `coupon_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '优惠卷单号',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '标题',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '描述',
  `method` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '支付方式',
  `amount` int NOT NULL COMMENT '金额',
  `status` int NOT NULL COMMENT '支付状态 0:支付中 1:支付成功 2:支付失败 3:取消订单 4:发放成功 5:扣款成功 6:扣款成功（前端不展示订单）7:邀请码收益',
  `refund_status` int NOT NULL COMMENT '退款状态 0：未退款 1:请求退款中 2:退款成功',
  `pay_time` datetime NULL DEFAULT NULL COMMENT '支付时间',
  `close_time` datetime NULL DEFAULT NULL COMMENT '关闭时间',
  `expired_time` datetime NULL DEFAULT NULL COMMENT '过期时间',
  `notify_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '异步通知地址',
  `extra_param` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '附加参数',
  `attach` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '商户扩展参数',
  `client_ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '支付终端ip',
  `user_id` int NULL DEFAULT NULL COMMENT '创建者ID',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户名称',
  `merchant_id` int NULL DEFAULT NULL COMMENT '商家ID',
  `merchant_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'admin' COMMENT '商家名称',
  `product_type` int NOT NULL COMMENT '产品类型 1:购买vip 2:购买AI项目 3:模型 4:插件 5:工作流 1000:共创者续费',
  `product_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '产品类型对应的值',
  `sdk_order_result` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'SDK支付下单的结果',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `order_no`(`order_no` ASC) USING BTREE COMMENT '支付订单号索引'
) ENGINE = InnoDB AUTO_INCREMENT = 918 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '支付订单' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for project_favorite_records
-- ----------------------------
DROP TABLE IF EXISTS `project_favorite_records`;
CREATE TABLE `project_favorite_records`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `project_id` bigint UNSIGNED NOT NULL,
  `project_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '项目名称',
  `type` int NOT NULL COMMENT '项目类型',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_project`(`user_id`, `project_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 24 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for upload
-- ----------------------------
DROP TABLE IF EXISTS `upload`;
CREATE TABLE `upload`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '角色id',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户名',
  `plugin_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件描述',
  `version` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '时间版本',
  `author` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件作者',
  `platforms` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件支持的平台',
  `install_dir` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '安装目录唯一标识',
  `like_count` int NOT NULL DEFAULT 0 COMMENT '点赞的次数',
  `download` int NOT NULL DEFAULT 0 COMMENT '下载的次数',
  `project_zip_size` bigint NOT NULL DEFAULT 0 COMMENT 'AI项目压缩包大小，单位KB',
  `price_type` int NOT NULL DEFAULT 1 COMMENT '价格类型：1:免费 2:收费 3:VIP专享 ',
  `price_value` int NOT NULL DEFAULT 0 COMMENT '收费模式价格',
  `need_device` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '需要的设备类型, 1:cup 2:N卡 3:A卡',
  `image_path` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '市场显示的图片路径',
  `public_option` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '记录发布时的参数',
  `oss_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'oss文件地址',
  `pan_123_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '123网盘高速下载地址',
  `plugn_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '插件简介',
  `cloud_storage_link` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '网盘链接',
  `create_time` datetime NOT NULL COMMENT '上传的时间',
  `update_time` datetime NULL DEFAULT NULL COMMENT '更新时间',
  `state` int NOT NULL DEFAULT 0 COMMENT '0:未审核 1:审核通过',
  `favorite_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目总收藏量',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 198 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '上传文件记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for upload_filter
-- ----------------------------
DROP TABLE IF EXISTS `upload_filter`;
CREATE TABLE `upload_filter`  (
  `upload_id` int NOT NULL COMMENT '关联upload表的id字段',
  `filter_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '筛选的id即key值',
  `filter_value` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '筛选的value值',
  INDEX `upload_id`(`upload_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '筛选查询关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for upload_rejected
-- ----------------------------
DROP TABLE IF EXISTS `upload_rejected`;
CREATE TABLE `upload_rejected`  (
  `id` int NOT NULL,
  `upload_id` int NOT NULL COMMENT ' 项目id与模型的共用',
  `type` int NOT NULL COMMENT '类型：1：项目，2：模型，3：插件，4：工作流',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '原因',
  `created_at` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT NULL COMMENT '更新时间',
  `reviewer_id` int NULL DEFAULT NULL COMMENT '审核人id',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for upload_resources
-- ----------------------------
DROP TABLE IF EXISTS `upload_resources`;
CREATE TABLE `upload_resources`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '角色id',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户名',
  `res_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '资源名称',
  `short_desc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '资源描述(简短)',
  `version` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '时间版本',
  `author` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件作者',
  `platforms` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件支持的平台',
  `install_dir` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '安装目录唯一标识',
  `like_count` int NOT NULL DEFAULT 0 COMMENT '点赞的次数',
  `download` int NOT NULL DEFAULT 0 COMMENT '下载的次数',
  `res_zip_size` bigint NOT NULL DEFAULT 0 COMMENT '项目压缩包大小，单位KB',
  `price_type` int NOT NULL DEFAULT 1 COMMENT '价格类型：1:免费 2:收费 3:VIP专享 ',
  `price_value` int NOT NULL DEFAULT 0 COMMENT '收费模式价格',
  `res_type` int NOT NULL COMMENT '项目类型：1：模型2：插件3：工作流4：其他',
  `res_install` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '模型，插件，工作流等 推荐安装目录',
  `image_path` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '市场显示的图片路径',
  `oss_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'oss文件地址',
  `pan_123_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '123网盘高速下载地址',
  `res_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '资源简介(详细)',
  `ext_option` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT 'Json字符串，用于存储每种资源不同字段的数值',
  `cloud_storage_link` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '网盘链接',
  `create_time` datetime NOT NULL COMMENT '上传的时间',
  `update_time` datetime NOT NULL COMMENT '更新时间',
  `state` int NOT NULL DEFAULT 0 COMMENT '0:未审核 1:审核通过 2:未审核通过',
  `favorite_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目总收藏量',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 111 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '上传文件记录' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for upload_resources_filter
-- ----------------------------
DROP TABLE IF EXISTS `upload_resources_filter`;
CREATE TABLE `upload_resources_filter`  (
  `upload_id` int NOT NULL COMMENT '关联upload_other表的id字段',
  `filter_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '筛选的id即key值',
  `filter_value` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '筛选的value值',
  INDEX `upload_id`(`upload_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '筛选查询关联表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for upload_resources_tmp
-- ----------------------------
DROP TABLE IF EXISTS `upload_resources_tmp`;
CREATE TABLE `upload_resources_tmp`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '角色id',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户名',
  `res_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '资源名称',
  `short_desc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '资源描述(简短)',
  `version` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '时间版本',
  `author` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件作者',
  `platforms` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件支持的平台',
  `install_dir` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '安装目录唯一标识',
  `like_count` int NOT NULL DEFAULT 0 COMMENT '点赞的次数',
  `download` int NOT NULL DEFAULT 0 COMMENT '下载的次数',
  `res_zip_size` bigint NOT NULL DEFAULT 0 COMMENT '项目压缩包大小，单位KB',
  `price_type` int NOT NULL DEFAULT 1 COMMENT '价格类型：1:免费 2:收费 3:VIP专享 ',
  `price_value` int NOT NULL DEFAULT 0 COMMENT '收费模式价格',
  `res_type` int NOT NULL COMMENT '项目类型：1：模型2：插件3：工作流4：其他',
  `res_install` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '模型，插件，工作流等 推荐安装目录',
  `image_path` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '市场显示的图片路径',
  `oss_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'oss文件地址',
  `pan_123_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '123网盘高速下载地址',
  `res_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '资源简介(详细)',
  `ext_option` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT 'Json字符串，用于存储每种资源不同字段的数值',
  `cloud_storage_link` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '网盘链接',
  `create_time` datetime NOT NULL COMMENT '上传的时间',
  `update_time` datetime NOT NULL COMMENT '更新时间',
  `state` int NOT NULL DEFAULT 0 COMMENT '0:未审核 1:审核通过 2:未审核通过',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 127 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '上传文件记录' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for upload_tmp
-- ----------------------------
DROP TABLE IF EXISTS `upload_tmp`;
CREATE TABLE `upload_tmp`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '角色id',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户名',
  `plugin_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件描述',
  `version` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '时间版本',
  `author` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件作者',
  `platforms` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '插件支持的平台',
  `install_dir` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '安装目录唯一标识',
  `like_count` int NOT NULL DEFAULT 0 COMMENT '点赞的次数',
  `download` int NOT NULL DEFAULT 0 COMMENT '下载的次数',
  `project_zip_size` bigint NOT NULL DEFAULT 0 COMMENT 'AI项目压缩包大小，单位KB',
  `price_type` int NOT NULL DEFAULT 1 COMMENT '价格类型：1:免费 2:收费 3:VIP专享 ',
  `price_value` int NOT NULL DEFAULT 0 COMMENT '收费模式价格',
  `need_device` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '需要的设备类型, 1:cup 2:N卡 3:A卡',
  `image_path` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '市场显示的图片路径',
  `public_option` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '记录发布时的参数',
  `oss_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'oss文件地址',
  `pan_123_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '123网盘高速下载地址',
  `plugn_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '插件简介',
  `cloud_storage_link` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '网盘链接',
  `create_time` datetime NOT NULL COMMENT '上传的时间',
  `update_time` datetime NULL DEFAULT NULL COMMENT '更新时间',
  `state` int NOT NULL DEFAULT 0 COMMENT '0:未审核 1:审核通过',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 244 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '上传文件记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_download_records
-- ----------------------------
DROP TABLE IF EXISTS `user_download_records`;
CREATE TABLE `user_download_records`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `project_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `project_id` bigint UNSIGNED NOT NULL,
  `download_count` int UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_like_records
-- ----------------------------
DROP TABLE IF EXISTS `user_like_records`;
CREATE TABLE `user_like_records`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `project_id` bigint UNSIGNED NOT NULL,
  `type` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_project`(`user_id`, `project_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 60 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for user_machines
-- ----------------------------
DROP TABLE IF EXISTS `user_machines`;
CREATE TABLE `user_machines`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `machine_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `machine_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '设备名',
  `machine_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '设备类型',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 81 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_monthly_income_audit
-- ----------------------------
DROP TABLE IF EXISTS `user_monthly_income_audit`;
CREATE TABLE `user_monthly_income_audit`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `year` int NOT NULL COMMENT '年份',
  `month` int NOT NULL COMMENT '月份',
  `pay_order_count` int NULL DEFAULT 0 COMMENT '支付单数量',
  `refund_order_count` int NULL DEFAULT 0 COMMENT '退款数量',
  `income_amount` int NULL DEFAULT 0 COMMENT '收益金额(分)',
  `platformfee_amount` int NOT NULL DEFAULT 0 COMMENT '平台费（分）',
  `refund_amount` int NULL DEFAULT 0 COMMENT '退款金额(分)',
  `audit_status` tinyint NULL DEFAULT 0 COMMENT '审核状态（0-未审核，1-已审核）',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 73 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户每月收益审核表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_oss_access
-- ----------------------------
DROP TABLE IF EXISTS `user_oss_access`;
CREATE TABLE `user_oss_access`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `oss_type` int NOT NULL DEFAULT 1 COMMENT '高速下载类型：1、alioss 2、123pan',
  `user_id` int NOT NULL COMMENT '用户ID',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户名',
  `access_date` date NOT NULL COMMENT '访问日期',
  `access_count` int NULL DEFAULT 0 COMMENT '当日访问次数',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_date`(`user_id` ASC, `access_date` ASC, `oss_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '用户OSS访问记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_role` int NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `country` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `phone` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `vip_type` int NOT NULL DEFAULT 0 COMMENT 'vip类型 0：无vip 1:年会员 2:永久会员',
  `vip_expire_time` datetime NULL DEFAULT NULL COMMENT 'vip过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `machine_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后一次登录机器码',
  `machine_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '登录过的不同设备数量',
  `machine_code_change_count` int UNSIGNED NOT NULL COMMENT '记录用户修改机械码次数',
  `status` int NOT NULL DEFAULT 0 COMMENT '用户状态：0-正常，1-禁言，2-封禁，3-永久封禁',
  `ban_expire_time` datetime NULL DEFAULT NULL COMMENT '异常状态持续时间',
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '封禁原因',
  `platform_fee` int NULL DEFAULT NULL COMMENT '平台费比例，10表示收取10%的平台费',
  `invite_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '用户邀请码',
  `invite_commission_rate` tinyint UNSIGNED NULL DEFAULT 1 COMMENT '返现比例(默认1%)',
  `parent_invite_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '上级邀请码',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `invite_code`(`invite_code`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 2269 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users_info
-- ----------------------------
DROP TABLE IF EXISTS `users_info`;
CREATE TABLE `users_info`  (
  `user_id` int NOT NULL COMMENT '用户id',
  `alias` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '别名',
  `gender` int NULL DEFAULT 3 COMMENT '性别1，男 2，女 3，保密',
  `bio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '用户个人简介',
  `avatar_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像地址',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '姓名',
  `id_card_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '身份证',
  `id_card_expiry_date` datetime NULL DEFAULT NULL COMMENT '身份证有效期',
  `id_card_front_image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '身份证正面图片地址',
  `id_card_back_image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '身份证反面图片地址',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '住址',
  `wechat_image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '微信收款码',
  `bank_account_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '银行卡号',
  `bank_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '开户行',
  `alipay_image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '支付宝收款码',
  `paypal_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'PayPal',
  `balance` int NULL DEFAULT 0 COMMENT '余额',
  `coupon_used_count` int NULL DEFAULT 0 COMMENT '用户已消耗的优惠码数量',
  `state` int NOT NULL DEFAULT 0 COMMENT '数据信息审核状态0、未修改 1、未审核 2、未通过 3、已审核',
  `update_time` timestamp NULL DEFAULT NULL COMMENT '更新时间',
  `review_time` timestamp NULL DEFAULT NULL COMMENT '审核时间',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`user_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for withdraw_order
-- ----------------------------
DROP TABLE IF EXISTS `withdraw_order`;
CREATE TABLE `withdraw_order`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `withdraw_no` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '提现单号',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `user_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '用户名',
  `id_card` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '身份证',
  `mobile` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号',
  `amount` bigint NOT NULL COMMENT '提现金额（分）',
  `incometax_amount` int NOT NULL COMMENT '碎金（分）',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '提现状态（0待审核 1审核通过 2打款中 3已完成 4已拒绝 5已撤销）',
  `pay_order_id` bigint NULL DEFAULT NULL COMMENT '关联订单表id（如有）',
  `method` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '提现方式（如银行卡、支付宝、微信等）',
  `bank_account` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '银行卡号/账户',
  `bank_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '开户行',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注',
  `audit_time` datetime NULL DEFAULT NULL COMMENT '审核时间',
  `pay_time` datetime NULL DEFAULT NULL COMMENT '打款时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 34 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户提现申请表' ROW_FORMAT = Dynamic;

-- ============================================================
-- 种子数据 (Seed Data)
-- ============================================================

-- 默认角色
INSERT INTO `roles` (`id`, `role`) VALUES (1, 'admin'), (2, 'user');

-- ============================================================
-- 初始管理员账号
-- 
-- 用户名: admin
-- 密码:   admin123
-- 
-- 请登录管理后台后立即修改密码!
-- 管理后台地址: http://localhost:7000/admin
-- ============================================================
INSERT INTO `users` (`id`, `id_role`, `username`, `password`, `email`, `country`, `phone`, `vip_type`, `vip_expire_time`, `created_at`, `updated_at`) 
VALUES (1, 1, 'admin', '$2a$10$RR6RcZC7NXNOHmsyZ929WeOXnE6IVj4hv.t7nM1GCIIHHRgp.JWFi', '__ADMIN_EMAIL_PLACEHOLDER__', NULL, NULL, 0, NULL, NOW(), NOW());

INSERT INTO `users_info` (`user_id`, `state`) VALUES (1, 3);

SET FOREIGN_KEY_CHECKS = 1;
