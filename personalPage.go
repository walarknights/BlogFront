package controllers

import (
	"backend/models"

	"database/sql"
	"fmt"
	"log"
	"net/http"
	"path"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"   // 若需显式使用 *mysql.MySQLError 类型
	_ "github.com/go-sql-driver/mysql" // 注册 MySQL 驱动
)

func (ac *AuthController) GetPersonalInfo(c *gin.Context) {
	userID := c.Param("userId")
	userId, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var userInfo models.User
	query := `SELECT * FROM users WHERE id = ?`
	err = ac.DB.QueryRow(query, userId).Scan(&userInfo.ID, &userInfo.Username, &userInfo.Password,
		&userInfo.Followers, &userInfo.Following, &userInfo.Avatar, &userInfo.DynamicNum)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "用户名或密码错误"})

		} else {
			c.JSON(500, gin.H{"error": err.Error()})

		}
		return
	}

	c.JSON(200, userInfo)
}

func (ac *AuthController) AddFocus(c *gin.Context) {
	var focus struct {
		FocusId   int
		FocusedId int
	}
	var isFocus int
	err := c.ShouldBindJSON(&focus)
	if err != nil {
		c.JSON(400, gin.H{"message": "错误的数据格式"})
		return
	}
	if focus.FocusId == focus.FocusedId {
		isFocus = 0
		c.JSON(200, gin.H{"isFocus": isFocus, "message": "不能关注自己"})
		return
	}
	_, err = ac.DB.Exec("INSERT INTO focus(focusId, focusedId) VALUES (?, ?)", focus.FocusId, focus.FocusedId)

	if err != nil {
		// 判断是否是唯一键冲突
		if mysqlErr, ok := err.(*mysql.MySQLError); ok && mysqlErr.Number == 1062 {
			isFocus = 1
			c.JSON(200, gin.H{"isFocus": isFocus, "message": "已经关注过了"})
			return
		} else {
			c.JSON(500, gin.H{"error": "插入数据失败", "message": "关注失败"})
			return
		}
	}
	isFocus = 2
	c.JSON(200, gin.H{
		"message": "关注成功",
		"isFocus": isFocus,
	})

}

func (ac *AuthController) RemoveFocus(c *gin.Context) {
	var focus struct {
		FocusId   int
		FocusedId int
	}

	err := c.ShouldBindJSON(&focus)
	if err != nil {
		c.JSON(400, gin.H{"message": "错误的数据格式"})
		return
	}
	_, err = ac.DB.Exec("DELETE FROM focus WHERE focusId = ? AND focusedId = ?", focus.FocusId, focus.FocusedId)
	if err != nil {
		c.JSON(500, gin.H{"error": "删除数据失败"})
		return
	}

	c.JSON(200, gin.H{
		"message": "取消关注成功",
	})
}

func (ac *AuthController) GetFoucsList(c *gin.Context) {
	userID := c.Param("userId")
	userId, err := strconv.ParseUint(userID, 10, 32)
	var focusUserId []int
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	rows, err := ac.DB.Query(`SELECT focusedId FROM focus WHERE focusId = ?`, userId)
	if err != nil {
		if err == sql.ErrNoRows {

			c.Status(204)
		} else {
			log.Printf("数据库查询错误: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
		}
		return
	}
	defer rows.Close()
	for rows.Next() {
		var Id int
		err := rows.Scan(
			&Id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse focus"})
			return
		}
		focusUserId = append(focusUserId, Id)
	}
	type userFocusInfo struct {
		UserName string `json:"userName"`
		Avatar   string `json:"avatar"`
		UserId   int    `json:"userId"`
	}
	var response []userFocusInfo

	// 1. 动态生成占位符
	placeholders := make([]string, len(focusUserId))
	args := make([]interface{}, len(focusUserId))
	for i, id := range focusUserId {
		placeholders[i] = "?"
		args[i] = id

	}

	// 2. 拼接 SQL 查询语句
	query := fmt.Sprintf("SELECT username, avatar, id FROM users WHERE id IN (%s)", strings.Join(placeholders, ","))

	// 3. 执行查询
	rows, err = ac.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}
	defer rows.Close()
	for rows.Next() {

		var res userFocusInfo
		err := rows.Scan(
			&res.UserName,
			&res.Avatar,
			&res.UserId,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse focus"})
			return
		}

		response = append(response, res)
	}
	c.JSON(200, response)
}

func (ac *AuthController) GetFansList(c *gin.Context) {
	userID := c.Param("userId")
	userId, err := strconv.ParseUint(userID, 10, 32)

	var focusUserId []int
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	rows, err := ac.DB.Query(`SELECT focusId FROM focus WHERE focusedId = ?`, userId)
	if err != nil {
		if err == sql.ErrNoRows {
			c.Status(204)
		} else {
			log.Printf("数据库查询错误: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器内部错误"})
		}
		return
	}
	defer rows.Close()
	for rows.Next() {
		var Id int
		err := rows.Scan(
			&Id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse focus"})
			return
		}
		focusUserId = append(focusUserId, Id)
	}
	type userFocusInfo struct {
		UserName string `json:"userName"`
		Avatar   string `json:"avatar"`
		UserId   int    `json:"userId"`
		IsFocus  bool   `json:"isFocus"`
	}
	var response []userFocusInfo

	if len(focusUserId) == 0 {
		c.JSON(200, response)
		return
	}

	// 查询当前用户已关注的用户id集合
	focusMap := make(map[int]bool)
	rows2, err := ac.DB.Query(`SELECT focusedId FROM focus WHERE focusId = ?`, userId)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var fid int
			if err := rows2.Scan(&fid); err == nil {
				focusMap[fid] = true
			}
		}
	}

	placeholders := make([]string, len(focusUserId))
	args := make([]interface{}, len(focusUserId))
	for i, id := range focusUserId {
		placeholders[i] = "?"
		args[i] = id
	}

	query := fmt.Sprintf("SELECT username, avatar, id FROM users WHERE id IN (%s)", strings.Join(placeholders, ","))

	rows, err = ac.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}
	defer rows.Close()
	for rows.Next() {
		var res userFocusInfo
		err := rows.Scan(
			&res.UserName,
			&res.Avatar,
			&res.UserId,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse focus"})
			return
		}
		// 判断当前用户是否关注了该粉丝
		res.IsFocus = focusMap[res.UserId]
		response = append(response, res)
	}
	c.JSON(200, response)
}

func (ac *AuthController) GetPersonalArticle(c *gin.Context) {
	userID := c.Param("userId")
	userId, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	type ArticleInfo struct {
		Title     string `json:"title"`
		Abstract  string `json:"abstract"`
		ArticleId int    `json:"articleId"`
	}
	var articles []ArticleInfo
	var articleID []int

	rows, err := ac.DB.Query(
		"SELECT id, title, abstract FROM article WHERE userId = ? ORDER BY likes DESC LIMIT 3",
		userId,
	)
	if err != nil {
		fmt.Println("数据库查询错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询1"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var art ArticleInfo
		var articleId int
		if err := rows.Scan(&art.ArticleId, &art.Title, &art.Abstract); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "解析文章失败"})
			return
		}
		articleId = art.ArticleId
		articles = append(articles, art)
		articleID = append(articleID, articleId)
	}

	var Url []string
	if len(articleID) > 0 {
		placeholders := make([]string, len(articleID))
		args := make([]interface{}, len(articleID))
		for i, id := range articleID {
			placeholders[i] = "?"
			args[i] = id
		}
		query := fmt.Sprintf("SELECT url FROM articleimg WHERE id IN (%s)", strings.Join(placeholders, ","))
		rows1, err := ac.DB.Query(query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
			return
		}
		defer rows1.Close()
		for rows1.Next() {
			var url string
			if err := rows1.Scan(&url); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "解析文章失败"})
				return
			}
			Url = append(Url, url)
		}
	}

	c.JSON(200, gin.H{
		"articles": articles,
		"Url":      Url,
	})
}

func (ac *AuthController) GetLikeArticle(c *gin.Context) {
	userID := c.Param("userId")
	userId, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	type ArticleInfo struct {
		Title     string `json:"title"`
		Abstract  string `json:"abstract"`
		ArticleId int    `json:"articleId"`
	}
	var articles []ArticleInfo
	var articleID []int

	// 查询用户最近点赞的最多三篇文章
	rows, err := ac.DB.Query(
		`SELECT a.id, a.title, a.abstract 
		 FROM article a
		 JOIN likes l ON a.id = l.articleId
		 WHERE l.userId = ? AND l.likes = 1
		 ORDER BY l.articleId DESC LIMIT 3`, userId)
	if err != nil {
		fmt.Println("数据库查询错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var art ArticleInfo
		if err := rows.Scan(&art.ArticleId, &art.Title, &art.Abstract); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "解析文章失败"})
			return
		}
		articles = append(articles, art)
		articleID = append(articleID, art.ArticleId)
	}

	var Url []string
	if len(articleID) > 0 {
		placeholders := make([]string, len(articleID))
		args := make([]interface{}, len(articleID))
		for i, id := range articleID {
			placeholders[i] = "?"
			args[i] = id
		}
		query := fmt.Sprintf("SELECT url FROM articleimg WHERE id IN (%s)", strings.Join(placeholders, ","))
		rows1, err := ac.DB.Query(query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
			return
		}
		defer rows1.Close()
		for rows1.Next() {
			var url string
			if err := rows1.Scan(&url); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "解析文章失败"})
				return
			}
			Url = append(Url, url)
		}
	}

	c.JSON(200, gin.H{
		"articles": articles,
		"Url":      Url,
	})
}

func (ac *AuthController) GetFavoriteArticle(c *gin.Context) {
	userID := c.Param("userId")
	userId, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	type ArticleInfo struct {
		Title     string `json:"title"`
		Abstract  string `json:"abstract"`
		ArticleId int    `json:"articleId"`
	}
	var articles []ArticleInfo
	var articleID []int

	// 查询用户最近收藏的最多三篇文章
	rows, err := ac.DB.Query(
		`SELECT a.id, a.title, a.abstract 
		 FROM article a
		 JOIN favorites f ON a.id = f.articleId
		 WHERE f.userId = ? AND f.favorites = 1
		 ORDER BY f.articleId DESC LIMIT 3`, userId)
	if err != nil {
		fmt.Println("数据库查询错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var art ArticleInfo
		if err := rows.Scan(&art.ArticleId, &art.Title, &art.Abstract); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "解析文章失败"})
			return
		}
		articles = append(articles, art)
		articleID = append(articleID, art.ArticleId)
	}

	var Url []string
	if len(articleID) > 0 {
		placeholders := make([]string, len(articleID))
		args := make([]interface{}, len(articleID))
		for i, id := range articleID {
			placeholders[i] = "?"
			args[i] = id
		}
		query := fmt.Sprintf("SELECT url FROM articleimg WHERE id IN (%s)", strings.Join(placeholders, ","))
		rows1, err := ac.DB.Query(query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
			return
		}
		defer rows1.Close()
		for rows1.Next() {
			var url string
			if err := rows1.Scan(&url); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "解析文章失败"})
				return
			}
			Url = append(Url, url)
		}
	}

	c.JSON(200, gin.H{
		"articles": articles,
		"Url":      Url,
	})
}

func (ac *AuthController) GetFavoriteArticleList(c *gin.Context) {
	userID := c.Param("userId")
	userId, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	type ArticleInfo struct {
		Title     string `json:"title"`
		Abstract  string `json:"abstract"`
		ArticleId int    `json:"articleId"`
	}
	var articles []ArticleInfo
	var articleID []int

	// 查询用户最近收藏的最多三篇文章
	rows, err := ac.DB.Query(
		`SELECT a.id, a.title, a.abstract 
		 FROM article a
		 JOIN favorites f ON a.id = f.articleId
		 WHERE f.userId = ? AND f.favorites = 1
		 ORDER BY f.articleId`, userId)
	if err != nil {
		fmt.Println("数据库查询错误:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var art ArticleInfo
		if err := rows.Scan(&art.ArticleId, &art.Title, &art.Abstract); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "解析文章失败"})
			return
		}
		articles = append(articles, art)
		articleID = append(articleID, art.ArticleId)
	}

	var Url []string
	if len(articleID) > 0 {
		placeholders := make([]string, len(articleID))
		args := make([]interface{}, len(articleID))
		for i, id := range articleID {
			placeholders[i] = "?"
			args[i] = id
		}
		query := fmt.Sprintf("SELECT url FROM articleimg WHERE id IN (%s)", strings.Join(placeholders, ","))
		rows1, err := ac.DB.Query(query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
			return
		}
		defer rows1.Close()
		for rows1.Next() {
			var url string
			if err := rows1.Scan(&url); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "解析文章失败"})
				return
			}
			Url = append(Url, url)
		}
	}

	c.JSON(200, gin.H{
		"articles": articles,
		"Url":      Url,
	})
}

func (ac *AuthController) PersonalSetting(c *gin.Context) {
	userID := c.Param("userId")
	userId, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Avatar   string `json:"avatar"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 构造动态 SQL
	fields := []string{}
	args := []interface{}{}

	if req.Username != "" {
		fields = append(fields, "username = ?")
		args = append(args, req.Username)
	}
	if req.Password != "" {
		// 密码加密
		hPassword, err := hashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "密码加密失败"})
			return
		}
		fields = append(fields, "password = ?")
		args = append(args, hPassword)
	}
	if req.Avatar != "" {
		fields = append(fields, "avatar = ?")
		args = append(args, req.Avatar)
	}
	if len(fields) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "没有需要更新的字段"})
		return
	}
	args = append(args, userId)
	query := fmt.Sprintf("UPDATE users SET %s WHERE id = ?", strings.Join(fields, ", "))

	_, err = ac.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "修改成功"})
}

func (ac *AuthController) SaveAvatar(c *gin.Context) {
	userID := c.Param("userId")

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 保存文件到本地
	ext := path.Ext(file.Filename)
	dst := "./static/usersInfo/avatar/" + userID + ext
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	dst1 := "/static/usersInfo/avatar/" + userID + ext
	c.JSON(http.StatusOK, gin.H{
		"message": "上传成功",
		"url":     dst1,
	})
}
