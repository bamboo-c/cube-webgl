var Main = {

	canvas : null,
	gl : null,

	webGl : null,

	init : function() {

		//canvasを取得
		var canvas = document.getElementById( "canvas" );
		canvas.width = 500;
		canvas.height = 300;


		Main.webGl = new WebGL( canvas );


		//vertex shaderの作成
		var vScript = document.getElementById( "vs" );

		//fragment shaderの作成
		var fScript = document.getElementById( "fs" );

		//プログラムオブジェクトの作成
		Main.webGl.createProgramObject( vScript.text, fScript.text );

		//ポリゴン作成
		var point1 = new Point3d( 0.0, 1.0, 0.0 );
		var point2 = new Point3d( 1.0, 0.0, 0.0 );
		var point3 = new Point3d( -1.0, 0.0, 0.0 );
		var polygon = new Polygon( point1, point2, point3 );

		//色指定
		var color1 = new vertexColor( 1.0, 0.0, 0.0, 1.0 );
		var color2 = new vertexColor( 0.0, 1.0, 0.0, 1.0 );
		var color3 = new vertexColor( 0.0, 0.0, 1.0, 1.0 );
		var color  = new Polygon( color1, color2, color3 )

		//ポリゴンを追加
		Main.webGl.add( polygon );
		Main.webGl.add( color );

		Main.webGl.update();

	}

}


//---------------------------------------------------
//	▼ WebGL ▼
//---------------------------------------------------
var WebGL = function( i_canvas ) {

	this.gl;
	this.canvas = i_canvas;
	this.program;
	this.vShader;
	this.fShader;

	this._polygons = [];

	this._init.apply( this );

}
WebGL.prototype = {

	//------------------------------------------------
	//	init
	//------------------------------------------------
	_init : function() {

		//webglコンテキストを取得
		this.gl = this.canvas.getContext( "webgl" );

		//canvasを初期化する色を設定する
		this.gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

		//canvasを初期化する際の深度を設定する
		this.gl.clearDepth( 1.0 );

		//canvasを初期化
		this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

	},

	//------------------------------------------------
	//
	//------------------------------------------------
	add : function( i_polygon ) {

		this._polygons.push( i_polygon );

	},

	//------------------------------------------------
	//	add shader
	//------------------------------------------------
	createShader : function( i_script, i_type ) {

		//shaderを作成
		var shader = this.gl.createShader( i_type );

		//shaderを追加
		this.gl.shaderSource( shader, i_script );

		//shaderをコンパイル
		this.gl.compileShader( shader );

		//shaderのコンパイル失敗の時
		if( !this.gl.getShaderParameter( shader, this.gl.COMPILE_STATUS ) ) {

			console.log( this.gl.getShaderInfoLog( shader ) );
			return null;

		}

		return shader;

	},

	//------------------------------------------------
	//	add program object
	//------------------------------------------------
	createProgramObject : function( i_vShaderScript, i_fShaderScript ) {

		//vertex shaderの作成
		this.vShader = this.createShader( i_vShaderScript, this.gl.VERTEX_SHADER );

		//fragment shaderの作成
		this.fShader = this.createShader( i_fShaderScript, this.gl.FRAGMENT_SHADER );

		//プログラムオブジェクトの作成
		this.program = this.gl.createProgram();

		//プログラムオブジェクトにshaderを割り当てる
		this.gl.attachShader( this.program, this.vShader );
		this.gl.attachShader( this.program, this.fShader );

		//shaderをリンク
		this.gl.linkProgram( this.program );


		//shaderのリンク成功時
		if( this.gl.getProgramParameter( this.program, this.gl.LINK_STATUS ) ) {

			//プログラムオブジェクトを有効にする
			this.gl.useProgram( this.program );

		//shaderのリンク失敗時
		}else {

			console.log( this.gl.getProgramInfoLog( this.program ) );
			return null;

		}

		return this.program;

	},

	//------------------------------------------------
	//
	//------------------------------------------------
	update : function() {


		//bufferを作成
		var vbo = this.gl.createBuffer();
		//bufferをバインド
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, vbo );
		//bufferにデータをセット
		this.gl.bufferData( this.gl.ARRAY_BUFFER, new Float32Array( this._polygons[0].get() ), this.gl.STATIC_DRAW );
		//bufferのバインドを無効化
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, null );

		// attributeLocationを配列に取得
		var attLocation = new Array(2)

		//作成したbufferをattributeに設定
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, vbo );
		//attribute属性の変数positionを取得
		attLocation[0] = this.gl.getAttribLocation( this.program, "position" );
		attLocation[1] = this.gl.getAttribLocation( this.program, "color" );

		//要素数
		var attStride = new Array(2);
		attStride[0] = 3;
		attStride[1] = 4;

		//attribute属性を有効にする
		this.gl.enableVertexAttribArray( attLocation[0] );
		//attribute属性を登録
		this.gl.vertexAttribPointer( attLocation[0], attStride[0], this.gl.FLOAT, false, 0, 0 );
		//bufferのバインドを無効化
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, null );

		var m = new matIV();
		// 各種行列の生成と初期化
		var mMatrix = m.identity( m.create() );
		var vMatrix = m.identity( m.create() );
		var pMatrix = m.identity( m.create() );
		var mvpMatrix = m.identity( m.create() );

		// ビュー座標変換行列
		m.lookAt( [0.0, 1.0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix );
		// プロジェクション座標変換行列
		m.perspective( 90, this.canvas.width / this.canvas.height, 0.1, 100, pMatrix );

		// 各行列を掛け合わせ座標変換行列を完成させる
		m.multiply( pMatrix, vMatrix, mvpMatrix );
		m.multiply( mvpMatrix, mMatrix, mvpMatrix );


		//uniformLocationの取得
		var uniLocation = this.gl.getUniformLocation( this.program, "mvpMatrix" );

		//uniformLocationへ座標変換行列を登録
		this.gl.uniformMatrix4fv( uniLocation, false, mvpMatrix );

		//モデルの描画
		this.gl.drawArrays( this.gl.TRIANGLES, 0, 3 );

		//コンテキストの再描画
		this.gl.flush();

	}


}
//---------------------------------------------------
//	▲ WebGL ▲
//---------------------------------------------------


//---------------------------------------------------
//	▼ Point3d ▼
//---------------------------------------------------
var Point3d = function( i_x, i_y, i_z ) {

	this.x = i_x || 0.0;
	this.y = i_y || 0.0;
	this.z = i_z || 0.0;

	this._init.apply( this );

}
Point3d.prototype = {

	//------------------------------------------------
	//	init
	//------------------------------------------------
	_init : function() {

	}
}
//---------------------------------------------------
//	▲ Point3d ▲
//---------------------------------------------------

//---------------------------------------------------
//	▼ vertexColor ▼
//---------------------------------------------------
var vertexColor = function( i_c1, i_c2, i_c3 ) {

	this.c1 = i_c1 || 0.0;
	this.c2 = i_c2 || 0.0;
	this.c3 = i_c3 || 0.0;

	this._init.apply( this );

}
vertexColor.prototype = {

	//------------------------------------------------
	//	init
	//------------------------------------------------
	_init : function() {

	}
}
//---------------------------------------------------
//	▲ vertexColor ▲
//---------------------------------------------------


//---------------------------------------------------
//	▼ Polygon ▼
//---------------------------------------------------
var Polygon = function( i_point1, i_point2, i_point3, i_color1, i_color2, i_color3 ) {

	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.c1 = 0;
	this.c2 = 0;
	this.c3 = 0;
	this.point1 = i_point1 || new Point3d();
	this.point2 = i_point2 || new Point3d();
	this.point3 = i_point3 || new Point3d();
	this.color1 = i_color1 || new vertexColor();
	this.color2 = i_color2 || new vertexColor();
	this.color3 = i_color3 || new vertexColor();

	this._init.apply( this );

}
Polygon.prototype = {

	//------------------------------------------------
	//	init
	//------------------------------------------------
	_init : function() {

	},

	//------------------------------------------------
	//	get
	//------------------------------------------------
	get : function() {

		var verteies = [];
		verteies.push( this.point1.x, this.point1.y, this.point1.z );
		verteies.push( this.point2.x, this.point2.y, this.point2.z );
		verteies.push( this.point3.x, this.point3.y, this.point3.z );

		return verteies;

	}
}
//---------------------------------------------------
//	▲ Polygon ▲
//---------------------------------------------------


Main.init();
