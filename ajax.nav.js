(function (jQuery)
{
	/**
	* x13AjaxNav.js - Класс аякс-навигации по сайту и автоматического биндинга событий
	*
	* @author					Marat K. (frostosx, klyde13, icecrust13)
	* @license					GNU GPL 3: http://www.gnu.org/licenses/gpl.html
	* @contacts					klyde13[]gmail.com
	*
	* {
	* 	Требует чтобы ajax-ответ с сервера являлся JSON-объектом со следующими полями:
	* 		~ controller 		- имя контроллера
	* 		~ method 			- имя метода
	* 		~ content 			- контент для страницы
	* 		~ [title] 			- опциональное поле, title для страницы
	* 		~ [destinationNode] - опциональное поле, определяющее целевой html-элемент
	* }
	*
	* При первой загрузки страницы необходимо указать параметры URI, вызывав следующий метод 
	* init(base_url, controller, method)
	* @param string base_url	- корневой URL сайта, например "http://example.com/"
	* @param string controller	- текущий открытый контроллер, например "profile"
	* @param string method		- текущий открытый метод контроллера, например "view"
	*
	* @param object jQuery -	объект jQuery
	* @class x13AjaxNav
	* @constructor
	*/

	function x13AjaxNav(jq)
	{
		//приватная ссылка для доступа к объекту внутри колбеков с измененным контекстом
		var _t = this;
		_t.params = {};
		_t.jq = jq;

		/**
		* Установка параметров. Этот метод необходимо вызвать при первой загрузки страницы
		*
		* @param string base_url	- корневой URL сайта, например "http://example.com/"
		* @param string controller	- текущий открытый контроллер, например "profile"
		* @param string method		- текущий открытый метод контроллера, например "view"
		*
		* @method init
		* @return null
		*/
		_t.init = function (base_url, controller, method)
		{
			_t.params.base_url = base_url;
			_t.params.controller = controller;
			_t.params.method = method;
		}

		_t.global = (function () {return this;})(); //window

		/**
		* Callback для визуализации загрузки страницы, будет вызываться перед отправкой ajax-запроса
		*
		* @method navEffect
		* @return null
		*/
		_t.navEffect = function () {};

		/**
		* Callback для скрытия эффекта визуализации загрузки страницы, будет вызывать после отправки ajax-запроса
		*
		* @method navDisEffect
		* @return null
		*/
		_t.navDisEffect = function () {};

		/**
		* Обработка пришедших ajax-данных
		* Если пришлел ответ с полем redirect, то запускает обработку урла redirect и прерывает обработку,
		* иначе устанавливает служебные переменные в объект конфигурации и запускает установку биндов на элементы страницы
		*
		* @method processAjaxResponse
		* @return null
		*/
		_t.processAjaxResponse = function (d)
		{
			if (d.redirect)
			{
				history.replaceState(null, null, link);
				return _t.processInternalLink(d.redirect, true);				
			}

			_t.params.controller = d.controller;
			_t.params.method = d.method;

			if (d.title)
				_t.jq('title').html(d.title);

			if (d.content)
			{
				var destinationNode;

				if (d.destinationNode)
					destinationNode = d.destinationNode;
						else destinationNode = _t.jq('#showContentSpan') ? '#showContentSpan' : 'body';

				_t.jq(destinationNode).html(d.content);
			}

			if (typeof _t.processAjaxResponseInterlayer == 'function')
				_t.processAjaxResponseInterlayer(d);

			_t.reloaded();

			_t.lastOk = true;
		};

		/**
		**
		* Прослойка для метода обработки пришедших ajax-данных this.processAjaxResponse
		* @method processAjaxResponseInterlayer
		* @return null
		*/
		_t.processAjaxResponseInterlayer = function (d) {};

		/**
		* Метод обработки ошибки ajax-запроса
		*
		* @method isBaseURL
		* @return boolean результат проверки
		*/
		_t.processError = function (e)
		{
			alert('ошибка выполнения запроса');
		};

		/**
		* Метод проверки URL на предмет его принадлежности нашему сайту
		*
		* @method isBaseURL
		* @param string url - url для проверки
		* @return boolean результат проверки
		*/
		_t.isBaseURL = function (url)
		{
			return (url + "").toLowerCase().indexOf(_t.params.base_url.toLowerCase()) === 0;
		};

		/**
		* Метод обработки URL
		*
		* @method isBaseURL
		* @param string link - url для обработки
		* @return boolean успешность обработки URL
		*/
		_t.processInternalLink = function (link)
		{
			if (!_t.isBaseURL(link)) return false;

			_t.lastOk = false;

			if (typeof _t.navEffect == 'function')
				_t.navEffect();

			$.ajax(
				{
					type: "GET",
					dataType: "JSON",
					url: link,
					async: false,
					success: _t.processAjaxResponse,
					error: _t.processError
				}
			);

			if (typeof _t.navDisEffect == 'function')
				_t.navDisEffect();
			
			return _t.lastOk;
		};

		/**
		* Метод-calback для обработки клика по ссылке
		* Для ajax-Обрабоки ссылка должна быть локальной, а так же ссылка или её первый родитель должны иметь класс ajaxNav
		*
		* @method linkClick
		* @param object e - объект события клика
		* @return boolean взвращает true, если сыылка не должна обрабатываться, fasle - если ссылка прошла обработку
		*/
		_t.linkClick = function (e)
		{
			var el = _t.jq(e.target);

			if (el.prop('tagName') === 'IMG'
				&& el.parent().prop('tagName') === 'A') el = _t.jq(el.parent());

			if (el.prop('tagName') !== "A") return true;
			
			var href = el.prop('href');
			if (!_t.isBaseURL(href)) return true;

			if (!el.hasClass('ajaxNav') && !el.parent().hasClass('ajaxNav')) return true;

			
			if (_t.processInternalLink(href))
				history.pushState(null, null, href);

			e.stopPropagation();
			return false;
				
		};

		/**
		* Метод установки обработчиков событий на странице после её загруки/перезагрузки
		*
		* @method reloaded
		* @return null
		*/
		_t.reloaded = function ()
		{
			var k;
			for (var k in _t.rebinds['*'])
				_t.rebinds['*'][k]();

			indBind = _t.params.controller.toLowerCase();
			for (k in _t.rebinds['c'][indBind])
				if (typeof _t.rebinds['c'][indBind][k] == 'function')
					_t.rebinds['c'][indBind][k].apply(_t.global, []);

			var indBind = (_t.params.controller + '/' + _t.params.method).toLowerCase();
			for (k in _t.rebinds['cm'][indBind])
				_t.rebinds['cm'][indBind][k].apply(_t.global, []);

			var indBind = _t.params.method.toLowerCase();
			for (k in _t.rebinds['m'][indBind])
				_t.rebinds['m'][indBind][k].apply(_t.global, []);
		};

		/**
		* Метод установки функции, которая должна вызываться в зависимости от обработанного uri (controller, method)
		*
		* @param string dest - целевой uri для вызова функции
		* испозуйте "*"" чтобы функция вызывалась после каждой обработки на любоГо uri
		* испозуйте "/myMethod" чтобы функция вызывалась после обработки метода myMethod в любом из контроллеров
		* испозуйте "myController/" чтобы функция вызывалась после каждой обработки на любой странице контроллера myController
		* испозуйте "myController/myMethod" чтобы функция вызывалась после каждой обработки метода myMethod в контролллере myController
		*
		* @param function callBack - функция, которая будет вызываться в зависимости от обрабатываемого uri
		*
		* @method $
		* @return booelan взвращает успешность усановки коллбека
		*/
		_t.addRoute = function (dest, callBack)
		{
			if (typeof callBack !== 'function') return false;
			
			if (_t.rebinds == undefined) 		_t.rebinds = {};
			if (_t.rebinds['*'] == undefined) 	_t.rebinds['*'] = [];
			if (_t.rebinds['m'] == undefined) 	_t.rebinds['m'] = {};
			if (_t.rebinds['c'] == undefined) 	_t.rebinds['c'] = {};
			if (_t.rebinds['cm'] == undefined)	_t.rebinds['cm'] = {};

			if (!dest || dest == '*')
			{
				_t.rebinds['*'].push(callBack);
				return true;
			}

			dest = dest.split('/');

			if ((!dest[0] || dest[0] == '*') && !dest[1])
			{
				if (_t.rebinds['m'][dest[1]] == undefined) _t.rebinds['m'][dest[1]] = [];
				_t.rebinds['m'][dest[1]].push(callBack);
				return true;
			}

			if (dest[0] && (!dest[1] || dest[1] == '*'))
			{
				if (_t.rebinds['c'][dest[0]] == undefined) _t.rebinds['c'][dest[0]] = [];
				_t.rebinds['c'][dest[1]].push(callBack);
				_t.rebinds['c'].push(callBack);
				return true;
			}

			if (dest[0] && dest[1])
			{
				var ind = dest[0] + '/' + dest[1];
				if (_t.rebinds['cm'][ind] == undefined) _t.rebinds['cm'][ind] = [];
				_t.rebinds['cm'][ind].push(callBack);
				return true;
			}

			return false;
		};
		
		/**
		* Метод возвращающий текукищий unixtime
		*
		* @method now
		* @return integer unixtime
		*/
		_t.now = function ()
		{
			return Math.round((new Date()).getTime() / 1000);
		};
		
		_t.jq(document).ready(
			function ()
			{
				_t.params.loadedTime = _t.now();

				_t.jq(_t.global).bind('popstate', 
					function (e)
					{
						if ((_t.now() - _t.params.loadedTime) > 1) //if - костыль для [sctricted]контуженного[/sctricted] хрома
							_t.processInternalLink(_t.global.location);
					}
				);

				_t.jq('html').click(_t.linkClick);

				_t.reloaded();
			}
		);
	}

	jQuery.x13 = new x13AjaxNav(jQuery);
})(jQuery);

/**
* ####################################################################################################################
* Примеры использования
*
*/
$.x13.init('<?=base_url()?>', '<?=$this->router->controller?>', '<?=$this->router->method?>');

$.x13.processAjaxResponseInterlayer = function (d)
{
	if (d.hashId)
		this.params.hashId = d.hashId;

	if (d.userId)
		this.params.userId = d.userId;

	if (d.description)
		this.jq('#description').attr('content', d.description);

};

$.x13.navEffect = function ()
{
	this.jq('html').css('box-shadow', 'inset 0px 0px 10px 10px rgba(0, 0, 150, 0.2)');
	this.jq('a').css({'cursor': 'wait'});
};

$.x13.navDisEffect = function ()
{
	this.jq('a').css({'cursor': 'pointer'});
	this.jq('html').css('box-shadow', '');
}

$.x13.addRoute('*', letsAjaxAllForms);
$.x13.addRoute('/view', initLightBox);
$.x13.addRoute('/edit', initValidation);
$.x13.addRoute('profile/', initIM);

function letsAjaxAllForms()
{
	//.....
}

function initLightBox()
{
	//.....
}

function initValidation()
{
	//.....
}

function initIM()
{
	//.....
}