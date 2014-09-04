Array.prototype.join = function( i_array ) {

	var l = i_array.length;
	for( var i = 0; i < l; i++ ) {

		this.push( i_array[i] );

	}

}


//---------------------------------------------------
//	▼ Main ▼
//---------------------------------------------------
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
		var point1 = new Point3d( 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0 );
		var point2 = new Point3d( 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0 );
		var point3 = new Point3d( -1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0 );
		var polygon = new Polygon( point1, point2, point3 );
		polygon.x = -2.0;

		//ポリゴンを追加
		Main.webGl.add( polygon );

		//ポリゴン作成
		point1 = new Point3d( 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0 );
		point2 = new Point3d( 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0 );
		point3 = new Point3d( -1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0 );
		polygon = new Polygon( point1, point2, point3 );
		polygon.x = 2.0;

		//ポリゴンを追加
		Main.webGl.add( polygon );

		Main.webGl.update();

	}

}
//---------------------------------------------------
//	▲ Main ▲
//---------------------------------------------------


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

		var m = new matIV();

		//Cameraの計算
		var mMatrix = m.identity( m.create() );
		var vMatrix = m.identity( m.create() );
		var pMatrix = m.identity( m.create() );
		var tmpMatrix = m.identity(m.create());
		var mvpMatrix = m.identity( m.create() );


		//Cameraの位置計算( 1:Cameraの位置, 2:Cameraの方向, 3:??? )
		m.lookAt( [0.0, 0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix );

		//Perspectiveの計算( 1:角度, 2:比率, 3:near, 4:far )
		m.perspective( 90, this.canvas.width / this.canvas.height, 0.1, 100, pMatrix );

		// 各行列を掛け合わせ座標変換行列を完成させる
		m.multiply( pMatrix, vMatrix, mvpMatrix );
		m.multiply( mvpMatrix, mMatrix, mvpMatrix );

		//各ポリゴンを描画

		var polygon;
		var l = this._polygons.length;
		for( var i = 0; i < l; i++ ) {

			polygon = this._polygons[i];
			polygon.draw( this.gl, this.program, mvpMatrix, m, tmpMatrix, mMatrix );

		}

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
var Point3d = function( i_x, i_y, i_z, i_red, i_green, i_blue, i_alpha ) {

	this.x = i_x || 0.0;
	this.y = i_y || 0.0;
	this.z = i_z || 0.0;

	this.red = i_red || 0.0;
	this.green = i_green || 0.0;
	this.blue = i_blue || 0.0;
	this.alpha = i_alpha || 0.0;

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
//	▼ Polygon ▼
//---------------------------------------------------
var Polygon = function( i_point1, i_point2, i_point3 ) {

	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.point1 = i_point1 || new Point3d();
	this.point2 = i_point2 || new Point3d();
	this.point3 = i_point3 || new Point3d();

	this._init.apply( this );

}
Polygon.prototype = {

	//------------------------------------------------
	//	init
	//------------------------------------------------
	_init : function() {

	},

	//------------------------------------------------
	//	draw
	//------------------------------------------------
	draw : function( i_gl, i_program, i_matrix, i_m, i_tmp, i_mx ) {

		//ポリゴン情報作成
		var polygons = this.getVertex();
		//色情報
		var colors = this.getColor();

		//bufferを作成し、頂点情報を格納する
		var vertexVbo = i_gl.createBuffer();
		//bufferをバインド
		i_gl.bindBuffer( i_gl.ARRAY_BUFFER, vertexVbo );
		//bufferにデータをセット
		i_gl.bufferData( i_gl.ARRAY_BUFFER, new Float32Array( polygons ), i_gl.STATIC_DRAW );
		//bufferのバインドを無効化
		i_gl.bindBuffer( i_gl.ARRAY_BUFFER, null );


		//bufferを作成し、色情報を格納する
		var colorVbo = i_gl.createBuffer();
		//bufferをバインド
		i_gl.bindBuffer( i_gl.ARRAY_BUFFER, colorVbo );
		//bufferにデータをセット
		i_gl.bufferData( i_gl.ARRAY_BUFFER, new Float32Array( colors ), i_gl.STATIC_DRAW );
		//bufferのバインドを無効化
		i_gl.bindBuffer( i_gl.ARRAY_BUFFER, null );





		//作成したbufferを、頂点シェーダーのattribute変数に渡す
		i_gl.bindBuffer( i_gl.ARRAY_BUFFER, vertexVbo );
		//attribute属性の変数positionを取得
		var positionLocation = i_gl.getAttribLocation( i_program, "position" );
		//positionの要素数
		var positionStride = 3;
		//attribute属性を有効にする
		i_gl.enableVertexAttribArray( positionLocation );
		//attribute属性を登録
		i_gl.vertexAttribPointer( positionLocation, positionStride, i_gl.FLOAT, false, 0, 0 );



		//作成したbufferを、頂点シェーダーのattribute変数に渡す
		i_gl.bindBuffer( i_gl.ARRAY_BUFFER, colorVbo );
		//attribute属性の変数colorを取得
		var colorLocation = i_gl.getAttribLocation( i_program, "color" );
		//colorの要素数
		var colorStride = 4;
		//attribute属性を有効にする
		i_gl.enableVertexAttribArray( colorLocation );
		//attribute属性を登録
		i_gl.vertexAttribPointer( colorLocation, colorStride, i_gl.FLOAT, false, 0, 0 );



		//uniformLocationの取得
		var uniLocation = i_gl.getUniformLocation( i_program, "mvpMatrix" );
		//uniformLocationへ座標変換行列を登録
		i_gl.uniformMatrix4fv( uniLocation, false, i_matrix );
		//モデルの描画
		i_gl.drawArrays( i_gl.TRIANGLES, 0, 3 );

		// カウント数
		var count = 0;

		(function(){

			count++;

			var rad = (count % 360) * Math.PI / 180;
			var x = Math.cos(rad);
			var y = Math.sin(rad);

			i_m.identity(i_mx);
			i_m.translate(i_mx, [x, y + 1.0, 0.0], i_mx);


			i_m.multiply(i_tmp, i_mx, i_matrix);
			i_gl.uniformMatrix4fv(uniLocation, false, i_matrix);
			i_gl.drawArrays(i_gl.TRIANGLES, 0, 3);


			i_m.identity(i_mx);
			i_m.translate(i_mx, [1.0, -1.0, 0.0], i_mx);
			i_m.rotate(i_mx, rad, [0, 1, 0], i_mx);


			i_m.multiply(i_tmp, i_mx, i_matrix);
			i_gl.uniformMatrix4fv(uniLocation, false, i_matrix);
			i_gl.drawArrays(i_gl.TRIANGLES, 0, 3);


			var s = Math.sin(rad) + 1.0;
			i_m.identity(i_mx);
			i_m.translate(i_mx, [-1.0, -1.0, 0.0], i_mx);
			i_m.scale(i_mx, [s, s, 0.0], i_mx)


			i_m.multiply(i_tmp, i_mx, i_matrix);
			i_gl.uniformMatrix4fv(uniLocation, false, i_matrix);
			i_gl.drawArrays(i_gl.TRIANGLES, 0, 3);

			setTimeout(arguments.callee, 1000 / 30);

		})();


	},

	//------------------------------------------------
	//	get vertex
	//------------------------------------------------
	getVertex : function() {

		var verteies = [];

		verteies.push( this.x + this.point1.x, this.y + this.point1.y, this.z + this.point1.z );
		verteies.push( this.x + this.point2.x, this.y + this.point2.y, this.z + this.point2.z );
		verteies.push( this.x + this.point3.x, this.y + this.point3.y, this.z + this.point3.z );

		return verteies;

	},

	//------------------------------------------------
	//	get color
	//------------------------------------------------
	getColor : function() {

		var colors = [];

		colors.push( this.point1.red, this.point1.green, this.point1.blue, this.point1.alpha );
		colors.push( this.point2.red, this.point2.green, this.point2.blue, this.point2.alpha );
		colors.push( this.point3.red, this.point3.green, this.point3.blue, this.point3.alpha );

		return colors;

	}

}
//---------------------------------------------------
//	▲ Polygon ▲
//---------------------------------------------------


Main.init();


