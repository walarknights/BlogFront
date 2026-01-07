package controllers

import (
	"backend/models"
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func (ac *AuthController) Setarticle(c *gin.Context) {
	var article models.ArticleRecive

	if err := c.ShouldBindJSON(&article); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "无效的请求参数"})
		return
	}
	var user models.User
	query := "SELECT id, username, password, followers, followings, avatar, dynamicNum FROM users WHERE id = ?"
	err := ac.DB.QueryRow(query, article.UserId).Scan(
		&user.ID, &user.Username, &user.Password,
		&user.Followers, &user.Following, &user.Avatar, &user.DynamicNum,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "用户Id错误"})
		} else {
			log.Printf("数据库查询错误: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
		}
		return
	}

	insertQuery := "INSERT INTO article (userId, content, title, type, abstract, link) VALUES (?, ?, ?, ?, ?, ?)"
	_, err = ac.DB.Exec(insertQuery, article.UserId, article.Content, article.Title,
		article.ArticleType, article.Abstract, article.Link)
	if err != nil {
		log.Printf("插入article表失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
		return
	}
	c.JSON(200, gin.H{"message": "发布成功"})
}

func (ac *AuthController) GetArticle(c *gin.Context) {

	articleID := c.Param("id")
	if articleID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "缺少文章id"})
		return
	}

	var article struct {
		ID        int
		UserId    int
		Content   string
		Title     string
		Type      string
		Abstract  string
		Likes     int
		Favorites int
		Link      string
	}
	var link sql.NullString
	query := "SELECT id, userId, content, title, type, abstract, likes, favorites, link FROM article WHERE id = ?"
	err := ac.DB.QueryRow(query, articleID).Scan(
		&article.ID, &article.UserId, &article.Content, &article.Title,
		&article.Type, &article.Abstract, &article.Likes, &article.Favorites, &link,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"message": "未找到对应文章"})
		} else {
			log.Printf("查询article表失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
		}
		return
	}
	article.Link = ""
	if link.Valid {
		article.Link = link.String
	}

	// 查询作者用户信息
	var author struct {
		Username   string
		Followers  int
		Followings int
		Avatar     string
		DynamicNum int
	}
	userQuery := "SELECT username, followers, followings, avatar, dynamicNum FROM users WHERE id = ?"
	err = ac.DB.QueryRow(userQuery, article.UserId).Scan(
		&author.Username, &author.Followers, &author.Followings, &author.Avatar, &author.DynamicNum,
	)
	if err != nil {
		log.Printf("查询用户信息失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
		return
	}

	var coverUrl string
	imgQuery := "SELECT url FROM articleimg WHERE Id = ? LIMIT 1"
	err = ac.DB.QueryRow(imgQuery, articleID).Scan(&coverUrl)
	if err != nil {
		if err == sql.ErrNoRows {
			coverUrl = ""
		} else {
			log.Printf("查询articleimg表失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        article.ID,
		"userId":    article.UserId,
		"content":   article.Content,
		"title":     article.Title,
		"type":      article.Type,
		"abstract":  article.Abstract,
		"likes":     article.Likes,
		"favorites": article.Favorites,
		"link":      article.Link,
		"cover":     coverUrl,
		"author": gin.H{
			"username":   author.Username,
			"followers":  author.Followers,
			"followings": author.Followings,
			"avatar":     author.Avatar,
			"dynamicNum": author.DynamicNum,
		},
	})
}

func (ac *AuthController) SaveCover(c *gin.Context) {

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 保存文件到本地

	dst := "./static/articleCover/" + file.Filename
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	dst1 := "/static/articleCover/" + file.Filename
	insertQuery := "INSERT INTO articleimg (url) VALUES (?)"
	_, err = ac.DB.Exec(insertQuery, dst1)
	if err != nil {
		log.Printf("插入articleImg表失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":  "上传成功",
		"filename": file.Filename,
	})
}

func (ac *AuthController) GetArticleList(c *gin.Context) {
	rows, err := ac.DB.Query("SELECT id, userId, content, title, type, abstract, likes, favorites, link FROM article ORDER BY id DESC LIMIT 10")
	if err != nil {
		log.Printf("查询文章列表失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
		return
	}
	defer rows.Close()

	var articles []gin.H

	for rows.Next() {
		var article struct {
			ID        int
			UserId    int
			Content   string
			Title     string
			Type      string
			Abstract  string
			Likes     int
			Favorites int
			Link      string
		}
		var link sql.NullString
		if err := rows.Scan(&article.ID, &article.UserId, &article.Content, &article.Title, &article.Type, &article.Abstract, &article.Likes, &article.Favorites, &link); err != nil {
			log.Printf("扫描文章失败: %v", err)
			continue
		}
		article.Link = ""
		if link.Valid {
			article.Link = link.String
		}

		// 查询作者信息
		var author struct {
			Username   string
			Followers  int
			Followings int
			Avatar     string
			DynamicNum int
		}
		userQuery := "SELECT username, followers, followings, avatar, dynamicNum FROM users WHERE id = ?"
		err = ac.DB.QueryRow(userQuery, article.UserId).Scan(
			&author.Username, &author.Followers, &author.Followings, &author.Avatar, &author.DynamicNum,
		)
		if err != nil {
			log.Printf("查询用户信息失败: %v", err)
			continue
		}

		// 查询封面
		var coverUrl string
		imgQuery := "SELECT url FROM articleimg WHERE id = ? LIMIT 1"
		err = ac.DB.QueryRow(imgQuery, article.ID).Scan(&coverUrl)
		if err != nil && err != sql.ErrNoRows {
			log.Printf("查询封面失败: %v", err)
			continue
		}
		if err == sql.ErrNoRows {
			coverUrl = ""
		}

		articles = append(articles, gin.H{
			"id":        article.ID,
			"userId":    article.UserId,
			"content":   article.Content,
			"title":     article.Title,
			"type":      article.Type,
			"abstract":  article.Abstract,
			"likes":     article.Likes,
			"favorites": article.Favorites,
			"link":      article.Link,
			"cover":     coverUrl,
			"author": gin.H{
				"username":   author.Username,
				"followers":  author.Followers,
				"followings": author.Followings,
				"avatar":     author.Avatar,
				"dynamicNum": author.DynamicNum,
			},
		})
	}

	c.JSON(http.StatusOK, articles)
}

func (ac *AuthController) SetHistory(c *gin.Context) {
	var req struct {
		UserId    int       `json:"userId"`
		ArticleId int       `json:"articleId"`
		ViewTime  time.Time `json:"viewTime"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "无效的请求参数"})
		return
	}
	insertQuery := "INSERT INTO history (userId, articleId, time) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE time = VALUES(time)"
	_, err := ac.DB.Exec(insertQuery, req.UserId, req.ArticleId, req.ViewTime)
	if err != nil {
		log.Printf("插入历史列表失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
		return
	}
	c.JSON(200, gin.H{"message": "用户历史保存成功"})
}

func (ac *AuthController) GetHistory(c *gin.Context) {
	userID := c.Param("userId")
	userId, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// 查询history表，获取该用户的所有articleId和time
	rows, err := ac.DB.Query("SELECT articleId, time FROM history WHERE userId = ? ORDER BY time DESC LIMIT 100", userId)
	if err != nil {
		log.Printf("查询历史记录失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
		return
	}
	defer rows.Close()

	type HistoryItem struct {
		ArticleId int
		ViewTime  time.Time
	}
	var historyItems []HistoryItem
	for rows.Next() {
		var item HistoryItem
		if err := rows.Scan(&item.ArticleId, &item.ViewTime); err != nil {
			log.Printf("扫描历史记录失败: %v", err)
			continue
		}
		historyItems = append(historyItems, item)
	}

	var articles []gin.H
	for _, hi := range historyItems {
		var article struct {
			ID        int
			UserId    int
			Content   string
			Title     string
			Type      string
			Abstract  string
			Likes     int
			Favorites int
			Link      string
		}
		var link sql.NullString
		err := ac.DB.QueryRow("SELECT id, userId, content, title, type, abstract, likes, favorites, link FROM article WHERE id = ?", hi.ArticleId).
			Scan(&article.ID, &article.UserId, &article.Content, &article.Title, &article.Type, &article.Abstract, &article.Likes, &article.Favorites, &link)
		if err != nil {
			log.Printf("查询文章失败: %v", err)
			continue
		}
		article.Link = ""
		if link.Valid {
			article.Link = link.String
		}

		// 查询作者信息
		var author struct {
			Username   string
			Followers  int
			Followings int
			Avatar     string
			DynamicNum int
		}
		userQuery := "SELECT username, followers, followings, avatar, dynamicNum FROM users WHERE id = ?"
		err = ac.DB.QueryRow(userQuery, article.UserId).Scan(
			&author.Username, &author.Followers, &author.Followings, &author.Avatar, &author.DynamicNum,
		)
		if err != nil {
			log.Printf("查询用户信息失败: %v", err)
			continue
		}

		// 查询封面
		var coverUrl string
		imgQuery := "SELECT url FROM articleimg WHERE id = ? LIMIT 1"
		err = ac.DB.QueryRow(imgQuery, article.ID).Scan(&coverUrl)
		if err != nil && err != sql.ErrNoRows {
			log.Printf("查询封面失败: %v", err)
			continue
		}
		if err == sql.ErrNoRows {
			coverUrl = ""
		}

		articles = append(articles, gin.H{
			"id":        article.ID,
			"userId":    article.UserId,
			"content":   article.Content,
			"title":     article.Title,
			"type":      article.Type,
			"abstract":  article.Abstract,
			"likes":     article.Likes,
			"favorites": article.Favorites,
			"link":      article.Link,
			"cover":     coverUrl,
			"viewTime":  hi.ViewTime,
			"author": gin.H{
				"username":   author.Username,
				"followers":  author.Followers,
				"followings": author.Followings,
				"avatar":     author.Avatar,
				"dynamicNum": author.DynamicNum,
			},
		})
	}

	c.JSON(http.StatusOK, articles)
}

func (ac *AuthController) SearchArticleList(c *gin.Context) {

	var req struct {
		Query string `json:"q"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "无效的请求参数"})
		return
	}
	keyword := req.Query
	keyword = strings.TrimSpace(keyword)
	fmt.Println("keyword:", keyword)

	rows, err := ac.DB.Query(
		"SELECT id, userId, content, title, type, abstract, likes, favorites, link FROM article WHERE title LIKE ? ORDER BY likes DESC, id DESC LIMIT 10",
		"%"+keyword+"%",
	)
	if err != nil {
		log.Printf("查询文章列表失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
		return
	}
	defer rows.Close()

	var articles []gin.H

	for rows.Next() {
		var article struct {
			ID        int
			UserId    int
			Content   string
			Title     string
			Type      string
			Abstract  string
			Likes     int
			Favorites int
			Link      string
		}
		var link sql.NullString
		if err := rows.Scan(&article.ID, &article.UserId, &article.Content, &article.Title, &article.Type, &article.Abstract, &article.Likes, &article.Favorites, &link); err != nil {
			log.Printf("扫描文章失败: %v", err)
			continue
		}
		article.Link = ""
		if link.Valid {
			article.Link = link.String
		}

		// 查询作者信息
		var author struct {
			Username   string
			Followers  int
			Followings int
			Avatar     string
			DynamicNum int
		}
		userQuery := "SELECT username, followers, followings, avatar, dynamicNum FROM users WHERE id = ?"
		err = ac.DB.QueryRow(userQuery, article.UserId).Scan(
			&author.Username, &author.Followers, &author.Followings, &author.Avatar, &author.DynamicNum,
		)
		if err != nil {
			log.Printf("查询用户信息失败: %v", err)
			continue
		}

		// 查询封面
		var coverUrl string
		imgQuery := "SELECT url FROM articleimg WHERE id = ? LIMIT 1"
		err = ac.DB.QueryRow(imgQuery, article.ID).Scan(&coverUrl)
		if err != nil && err != sql.ErrNoRows {
			log.Printf("查询封面失败: %v", err)
			continue
		}
		if err == sql.ErrNoRows {
			coverUrl = ""
		}

		articles = append(articles, gin.H{
			"id":        article.ID,
			"userId":    article.UserId,
			"content":   article.Content,
			"title":     article.Title,
			"type":      article.Type,
			"abstract":  article.Abstract,
			"likes":     article.Likes,
			"favorites": article.Favorites,
			"link":      article.Link,
			"cover":     coverUrl,
			"author": gin.H{
				"username":   author.Username,
				"followers":  author.Followers,
				"followings": author.Followings,
				"avatar":     author.Avatar,
				"dynamicNum": author.DynamicNum,
			},
		})
	}

	c.JSON(http.StatusOK, articles)
}

func (ac *AuthController) LikeArticle(c *gin.Context) {
	ArticleID := c.Param("id")
	type LikeRequest struct {
		UserId int `json:"userId"`
	}
	var req LikeRequest
	var err error
	if err = c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "无效的请求参数"})
		return
	}
	userId := req.UserId // 从请求中获取userId
	// 使用INSERT ... ON DUPLICATE KEY UPDATE语法
	// 如果用户未点赞过该视频，则插入新记录，likes=1
	// 如果用户已点赞过该视频，则将likes取反(1变0或0变1)
	_, err = ac.DB.Exec(`
		INSERT INTO likes (userId, articleId, likes) 
		VALUES (?, ?, 1) 
		ON DUPLICATE KEY UPDATE 
		likes = IF(likes = 1, 0, 1)
	`, userId, ArticleID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "插入失败",
		})
		return
	}
	var like int
	err = ac.DB.QueryRow("SELECT likes FROM likes WHERE userId = ? && articleId = ?", userId, ArticleID).Scan(&like)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "点赞失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "操作成功", "islike": like})
}

// 收藏视频
func (ac *AuthController) FavoriteArticle(c *gin.Context) {
	ArticleID := c.Param("id")
	type LikeRequest struct {
		UserId int `json:"userId"`
	}
	var req LikeRequest
	var err error
	if err = c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "无效的请求参数"})
		return
	}
	userId := req.UserId
	_, err = ac.DB.Exec(`
		INSERT INTO favorites (userId, ArticleId, favorites) 
		VALUES (?, ?, 1) 
		ON DUPLICATE KEY UPDATE 
		favorites = IF(favorites = 1, 0, 1)
	`, userId, ArticleID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "插入失败",
		})
		return
	}
	var favorites int
	err = ac.DB.QueryRow("SELECT favorites FROM favorites WHERE userId = ? && ArticleId = ?", userId, ArticleID).Scan(&favorites)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "收藏失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "收藏成功", "isfavorites": favorites})
}

func (ac *AuthController) IsLike(c *gin.Context) {
	articleID := c.Param("id")
	type LikeRequest struct {
		UserId int `json:"userId"`
	}
	var req LikeRequest
	var err error
	if err = c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "无效的请求参数"})
		return
	}
	userId := req.UserId
	query := true
	var likes int

	err = ac.DB.QueryRow("SELECT likes FROM likes WHERE userId = ? AND articleId = ?", req.UserId, articleID).Scan(&likes)
	if err == sql.ErrNoRows {
		likes = 0 // 没有记录则默认未点赞
		query = false
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库查询失败"})
		return
	}
	fmt.Sprintln(likes)
	c.JSON(http.StatusOK, gin.H{"likes": likes, "query": query, "userId": userId})

}

func (ac *AuthController) IsFavorite(c *gin.Context) {
	articleID := c.Param("id")
	type FavoriteRequest struct {
		UserId int `json:"userId"`
	}
	var req FavoriteRequest
	var err error
	if err = c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "无效的请求参数"})
		return
	}
	userId := req.UserId

	var favorites int
	err = ac.DB.QueryRow("SELECT favorites FROM favorites WHERE userId = ? AND articleId = ?", userId, articleID).Scan(&favorites)
	if err == sql.ErrNoRows {
		favorites = 0
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库查询失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"favorites": favorites})
}

func (ac *AuthController) GetComments(c *gin.Context) {
	articleID := c.Param("id")

	articleId, err := strconv.ParseUint(articleID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid article ID"})
		return
	}

	var comments []models.Comment
	var parentUserID *uint
	var parentUserName *string
	var ParentUserAvatar *string
	// 使用原生 SQL 查询，并关联 ParentUser 信息
	sql := `
    SELECT c.*,
           pc.userId as parent_user_id,
           pc.userName as parent_user_name,
		   pc.userAvatar as parent_user_avatar

    FROM comments c
    LEFT JOIN comments pc ON c.parentId = pc.id
    WHERE c.articleId = ?
    ORDER BY c.rootId ASC, c.createdAt ASC
	`

	rows, err := ac.DB.Query(sql, articleId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}
	defer rows.Close()
	for rows.Next() {
		var comment models.Comment
		err := rows.Scan(
			&comment.ID,
			&comment.Content,
			&comment.UserId,
			&comment.UserName,
			&comment.UserAvatar,
			&comment.ArticleID,
			&comment.CreatedAt,
			&comment.ParentId,
			&comment.RootId,

			&parentUserID,
			&parentUserName,
			&ParentUserAvatar,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse comments"})
			return
		}

		if parentUserID != nil && parentUserName != nil {
			comment.ParentUser = &models.UserCom{
				UserId:     *parentUserID,
				UserName:   *parentUserName,
				UserAvatar: *ParentUserAvatar,
			}
		} else {
			comment.ParentUser = nil
		}

		comments = append(comments, comment)
	}
	c.JSON(http.StatusOK, comments)
}

// 添加评论
func (ac *AuthController) AddComment(c *gin.Context) {
	var input models.CreateCommentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 构造评论对象
	comment := models.Comment{
		ArticleID:  input.ArticleID,
		UserId:     input.UserID,
		UserName:   input.UserName,
		UserAvatar: input.UserAvatar,
		Content:    input.Content,
		ParentId:   input.ParentID,
		CreatedAt:  time.Now(),
	}

	// 开始事务
	tx, err := ac.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法开启事务"})
		return
	}

	// 插入评论（不指定 id，由数据库自动生成）
	result, err := tx.Exec(
		"INSERT INTO comments (content, userId, userName, userAvatar, articleId, createdAt, parentId, rootId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		comment.Content, comment.UserId, comment.UserName, comment.UserAvatar, comment.ArticleID,
		comment.CreatedAt, comment.ParentId, 0, // rootId 初始为 0
	)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "插入评论失败"})
		return
	}

	// 获取自增生成的 id
	commentID, err := result.LastInsertId()
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取评论 ID 失败"})
		return
	}

	// 如果是主楼评论，更新 rootId 为自身 id
	if input.ParentID == nil {
		_, err = tx.Exec("UPDATE comments SET rootId = ? WHERE id = ?", commentID, commentID)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "设置 rootId 失败"})
			return
		}
	} else {
		// 如果是子评论，查询父评论的 rootId 并设置
		var parentRootId uint
		err = tx.QueryRow("SELECT rootId FROM comments WHERE id = ?", *input.ParentID).Scan(&parentRootId)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "查询父评论 rootId 失败"})
			return
		}
		comment.RootId = parentRootId
		_, err = tx.Exec("UPDATE comments SET rootId = ? WHERE id = ?", parentRootId, commentID)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新子评论 rootId 失败"})
			return
		}
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "事务提交失败"})
		return
	}

	// 返回创建的评论
	comment.ID = uint(commentID)
	c.JSON(http.StatusCreated, gin.H{"comment": comment})
}
