class Board
{
    public PieceWidth:number;
    public PieceHeight:number;

    public IsWhiteTurn:boolean;
    public IsPlayingAsWhite:boolean;

    private _pieces:Piece[];
    public Pieces:{[row:number]:{[column:number]:Piece}};
    public LastPieceMoved:Piece;

    private _selectedPiece:Piece;
    private _possibleMoves:{x:number, y:number}[];
    private _mouseX:number;
    private _mouseY:number;

    public IsCheckmate:boolean;
    public IsStalemate:boolean;
    public IsWhiteWon:boolean;
    
    constructor(pieceWidth:number, pieceHeight:number)
    {
        this.PieceWidth = pieceWidth;
        this.PieceHeight = pieceHeight;

        this.Init(true);
    }

    public Init(isPlayingAsWhite:boolean)
    {
        this.IsWhiteTurn = true;
        this.IsPlayingAsWhite = isPlayingAsWhite;

        this.Pieces = {};
        for(let i = 0; i < 8; i++)
            this.Pieces[i] = {};

        this._pieces = [];
        for(let i = 0; i < 16; i++)
        {
            let piece:Piece;
            let x = i % 8 < 4 ? i % 4 : 7 - i % 4;
            let y = i < 8 ? 0 : 7;
            switch(i % 4)
            {
                case 0: piece = new Rook(x, y, i < 8, this); break;
                case 1: piece = new Knight(x, y, i < 8, this); break;
                case 2: piece = new Bishop(x, y, i < 8, this); break;
                case 3: piece = (~~(i/4))%2 == 0
                                ? new Queen(x, y, i < 8, this)
                                : new King(x, y, i < 8, this);  break;
            }
            this._pieces.push(piece);
            this.Pieces[piece.Y][piece.X] = piece;

            let pawn = new Pawn(i % 8, i < 8 ? 1 : 6, i < 8, this);
            this._pieces.push(pawn);
            this.Pieces[pawn.Y][pawn.X] = pawn;
        }

        this.LastPieceMoved = null;

        this._selectedPiece = null;
        this._possibleMoves = [];
        this._mouseX = 0;
        this._mouseY = 0;

        this.IsCheckmate = false;
        this.IsStalemate = false;
        this.IsWhiteWon = false;
    }

    public OnMouseDown(x:number, y:number)
    {
        if(!isInGame) return;
        if(this.IsCheckmate || this.IsStalemate) return;
        if(this.IsWhiteTurn != this.IsPlayingAsWhite) return;

        let pieceX = Math.max(0, Math.min(Math.floor(x / this.PieceWidth), 7));
        let pieceY = Math.max(0, Math.min(Math.floor(y / this.PieceHeight), 7));

        if(this.IsPlayingAsWhite) pieceY = 7 - pieceY;
        else pieceX = 7 - pieceX;

        if(pieceX in this.Pieces[pieceY])
        {
            if(this.Pieces[pieceY][pieceX].IsWhite != this.IsPlayingAsWhite)
                return;

            this._selectedPiece = this.Pieces[pieceY][pieceX];
            
            let possibleMoves = this._selectedPiece.GetPossibleMoves(this.Pieces);
            this._possibleMoves = this.FilterPossibleMoves(this._selectedPiece, possibleMoves);
        }
        
        this._mouseX = x;
        this._mouseY = y;
    }

    public OnMouseMove(x:number, y:number)
    {
        this._mouseX = x;
        this._mouseY = y;
            
    }

    public OnMouseUp(x:number, y:number)
    {
        if(this._selectedPiece === null)
            return;
        
        let pieceX = Math.max(0, Math.min(Math.floor(x / this.PieceWidth), 7));
        let pieceY = Math.max(0, Math.min(Math.floor(y / this.PieceHeight), 7));
        
        if(this.IsPlayingAsWhite) pieceY = 7 - pieceY;
        else pieceX = 7 - pieceX;

        if(pieceX in this.Pieces[pieceY])
        {
            if(this.Pieces[pieceY][pieceX].IsWhite == this._selectedPiece.IsWhite)
            {
                this._selectedPiece = null;
                return;
            }
        }

        this.Move(this._selectedPiece.X, this._selectedPiece.Y, pieceX, pieceY);

        this._mouseX = 0;
        this._mouseY = 0;
        this._selectedPiece = null;
    }

    public Move(x1:number, y1:number, x2:number, y2:number)
    {
        if(x1 < 0 || x1 > 7) return;
        if(y1 < 0 || y1 > 7) return;
        if(x2 < 0 || x2 > 7) return;
        if(y2 < 0 || y2 > 7) return;
        if(!(x1 in this.Pieces[y1])) return;
        if(this.Pieces[y1][x1].IsWhite != this.IsWhiteTurn) return;
        if(x2 in this.Pieces[y2] && this.Pieces[y1][x1].IsWhite == this.Pieces[y2][x2].IsWhite) return;

        let piece = this.Pieces[y1][x1];

        let possibleMoves = piece.GetPossibleMoves(this.Pieces);
        if(!possibleMoves.some(pos=>pos.x == x2 && pos.y == y2)) return;
        possibleMoves = this.FilterPossibleMoves(piece, possibleMoves);
        if(!possibleMoves.some(pos=>pos.x == x2 && pos.y == y2)) return;
        
        if(x2 in this.Pieces[y2])
            this._pieces.splice(this._pieces.indexOf(this.Pieces[y2][x2]), 1);

        delete this.Pieces[y1][x1];
        piece.MoveTo(x2, y2);
        this.Pieces[y2][x2] = piece;
        piece.OnAfterMove();
        this.LastPieceMoved = piece;

        this.IsWhiteTurn = !this.IsWhiteTurn;

        let availableMoves = 0;
        let kingX = 0;
        let kingY = 0;
        for(let piece2 of this._pieces)
        {
            if(piece2.IsWhite != this.IsWhiteTurn) continue;
            if(piece2 instanceof King)
            {
                kingX = piece2.X;
                kingY = piece2.Y;
            }

            let possibleMoves = piece2.GetPossibleMoves(this.Pieces);
            possibleMoves = this.FilterPossibleMoves(piece2, possibleMoves);
            availableMoves += possibleMoves.length;
        }

        if(availableMoves == 0)
        {
            if(Board.GetPiecesThatCanMoveTo(this.Pieces, !this.IsWhiteTurn, kingX, kingY).length == 0)
            {
                this.IsStalemate = true;
                this.IsCheckmate = false;
                this.IsWhiteWon = false;
            }
            else
            {
                this.IsStalemate = false;
                this.IsCheckmate = true;
                this.IsWhiteWon = !this.IsWhiteTurn;
            }

            setTimeout(()=>ws.send("search " + myNickname), 2500);
        }

        ws.send(`move ${myNickname} ${opponentNickname} ${x1} ${y1} ${x2} ${y2}`);
    }

    public Castle(x:number, y:number)
    {
        if(!(x in this.Pieces[y])) return;
        if(!(this.Pieces[y][x] instanceof Rook)) return;

        let rook = this.Pieces[y][x] as Rook;
        if(!rook.CanCastle) return;

        let newX = x == 0 ? 3 : 5;

        delete this.Pieces[y][x];
        rook.MoveTo(newX, y);
        this.Pieces[y][newX] = rook;
        rook.OnAfterMove();
    }

    public EnPassant(x:number, y:number)
    {
        if(!(x in this.Pieces[y])) return;
        if(!(this.Pieces[y][x] instanceof Pawn)) return;

        let pawn = this.Pieces[y][x];
        this._pieces.splice(this._pieces.indexOf(pawn), 1);
        
        delete this.Pieces[y][x];
    } 

    public Promotion(x:number, y:number)
    {
        if(!(x in this.Pieces[y])) return;
        if(!(this.Pieces[y][x] instanceof Pawn)) return;

        let pawn = this.Pieces[y][x];
        this._pieces.splice(this._pieces.indexOf(pawn), 1);
        
        let queen = new Queen(x, y, pawn.IsWhite, this);
        this._pieces.push(queen);

        this.Pieces[y][x] = queen;
    } 

    public Draw(ctx:CanvasRenderingContext2D)
    {
        // Drawing board itself
        for(let iy = 0; iy < 8; iy++)
        {
            for(let ix = 0; ix < 8; ix++)
            {
                ctx.fillStyle = (iy + ix) % 2 == 0 ? "white" : "#ccc";
                ctx.fillRect(ix * this.PieceWidth, iy * this.PieceHeight, this.PieceWidth, this.PieceHeight);
            }
        }
        
        // If player dragging any piece we will draw possible moves of this piece here
        // on top of the board but below of all other pieces
        if(this._selectedPiece !== null)
        {
            for(let pos of this._possibleMoves)
            {
                ctx.fillStyle = "#446682";

                let top:number,left:number;

                if(this.IsPlayingAsWhite)
                {
                    top = (7-pos.y) * this.PieceHeight;
                    left = pos.x * this.PieceWidth;
                }
                else
                {
                    top = pos.y * this.PieceHeight;
                    left = (7-pos.x) * this.PieceWidth;
                }

                ctx.fillRect(left, top, this.PieceWidth, this.PieceHeight);
            }
        }

        // Rendering cells coords
        for(let iy = 0; iy < 8; iy++)
        {
            for(let ix = 0; ix < 8; ix++)
            {
                ctx.font = "10px Nunito";
                ctx.fillStyle = (iy + ix) % 2 == 1 ? "white" : "#ccc";
                if(this.IsPlayingAsWhite)
                    ctx.fillText(String.fromCharCode(65 + ix) + (8 - iy), ix * this.PieceWidth + 2, (iy + 1) * this.PieceHeight - 2);
                else
                    ctx.fillText(String.fromCharCode(72 - ix) + (iy + 1), ix * this.PieceWidth + 2, (iy + 1) * this.PieceHeight - 2);
            }
        }

        // Rendering all pieces and if player holding piece ignore it
        for(let piece of this._pieces)
            if(piece !== this._selectedPiece)
                piece.Draw(ctx);
        
        // Rendering holding piece on top of every other piece
        if(this._selectedPiece !== null)
            this._selectedPiece.DrawDraggin(ctx, this._mouseX, this._mouseY);

        if(this.IsCheckmate)
        {
            if(this.IsWhiteWon == this.IsPlayingAsWhite)
                this.DrawGradientScene("green", "YOU WIN!");
            else
                this.DrawGradientScene("red", "YOU LOSE!");
        }
        else if(this.IsStalemate)
            this.DrawGradientScene("gray", "STALEMATE!");
    }

    private DrawGradientScene(color:string, text:string)
    {
        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

        ctx.font = "48px Nunito";
        ctx.fillStyle = "white";
        let textWidth = ctx.measureText(text).width;
        ctx.fillText(text, canvas.width / 2 - textWidth / 2, 100);
    }

    private FilterPossibleMoves(piece:Piece, possibleMoves:{x:number, y:number}[])
    {
        for(let i = 0; i < possibleMoves.length; i++)
        {
            let kingX = 0;
            let kingY = 0;

            let boardCopy:{[row:number]:{[column:number]:Piece}} = {};
            for(let i in this.Pieces)
            {
                boardCopy[i] = {};
                for(let j in this.Pieces[i])
                {
                    if(this.Pieces[i][j] != piece)
                        boardCopy[i][j] = this.Pieces[i][j].Clone();
                    if(boardCopy[i][j] instanceof King && boardCopy[i][j].IsWhite == this.IsWhiteTurn)
                    {
                        kingX = boardCopy[i][j].X;
                        kingY = boardCopy[i][j].Y;
                    }
                }
            }

            let pieceCopy = piece.Clone();
            pieceCopy.MoveTo(possibleMoves[i].x, possibleMoves[i].y);
            boardCopy[possibleMoves[i].y][possibleMoves[i].x] = pieceCopy;

            if(pieceCopy instanceof King && pieceCopy.IsWhite == this.IsWhiteTurn)
            {
                kingX = pieceCopy.X;
                kingY = pieceCopy.Y;
            }

            let kingAttackers = Board.GetPiecesThatCanMoveTo(boardCopy, !this.IsWhiteTurn, kingX, kingY);
            if(kingAttackers.length > 0)
            {
                possibleMoves.splice(i, 1);
                i--;
            }
        }
        return possibleMoves;
    }

    public static GetPieceColorAt(pieces:{[row:number]:{[column:number]:Piece}}, x:number, y:number):"white"|"black"|"empty"|"outofbounds"
    {
        if(x < 0 || x > 7 || y < 0 || y > 7) return "outofbounds";
        if(!(x in pieces[y])) return "empty";
        return pieces[y][x].IsWhite ? "white" : "black";
    }

    public static GetPiecesThatCanMoveTo(pieces:{[row:number]:{[column:number]:Piece}}, isWhiteTurn:boolean, x:number, y:number)
    {
        let ret:Piece[] = [];

        for(let i in pieces)
        {
            for(let j in pieces[i])
            {
                if(pieces[i][j].IsWhite != isWhiteTurn) continue;
                let poses = pieces[i][j].GetPossibleMoves(pieces);
                for(let pos of poses)
                {
                    if(pos.x == x && pos.y == y)
                    {
                        ret.push(pieces[i][j]);
                        break;
                    }
                }
            }
        }

        return ret;
    }
}